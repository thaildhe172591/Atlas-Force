import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { AtlasForgeMcpServer } from '../../src/mcp/index.js';

const TEST_ROOT = path.resolve(process.cwd(), 'tmp/mcp-smoke');

function parseToolText(result: any) {
    return JSON.parse(result.content[0].text);
}

async function removeTestRootWithRetry() {
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            await fs.rm(TEST_ROOT, { recursive: true, force: true });
            return;
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 30));
        }
    }
    await fs.rm(TEST_ROOT, { recursive: true, force: true });
}

describe('MCP smoke', () => {
    beforeEach(async () => {
        await removeTestRootWithRetry();
        await fs.mkdir(TEST_ROOT, { recursive: true });
    });

    afterEach(async () => {
        await removeTestRootWithRetry();
    });

    it('handles full task lifecycle with MCP tool handlers', async () => {
        const afDir = path.join(TEST_ROOT, '.atlasforge');
        await fs.mkdir(afDir, { recursive: true });
        await fs.writeFile(path.join(afDir, 'config.yaml'), 'promote_mode: direct\n', 'utf-8');

        const server = new AtlasForgeMcpServer(TEST_ROOT);

        const init = await server.handleToolCall('af_init', {});
        expect(parseToolText(init).ok).toBe(true);

        const start = await server.handleToolCall('af_start_task', { summary: 'MCP smoke task' });
        expect(parseToolText(start).session.status).toBe('active');

        const add = await server.handleToolCall('af_add_memory', {
            type: 'code-pattern',
            title: 'Pattern A',
            summary: 'Pattern memory',
        });
        expect(parseToolText(add).entry.memory_type).toBe('code-pattern');

        const status = await server.handleToolCall('af_status', {});
        expect(parseToolText(status).snapshot.staging_count).toBeGreaterThan(0);

        const close = await server.handleToolCall('af_close_task', { summary: 'MCP smoke done' });
        const closePayload = parseToolText(close);
        expect(closePayload.session.status).toBe('closed');
        expect(closePayload.promoted_count).toBeGreaterThan(0);

        const search = await server.handleToolCall('af_search', { query: 'Pattern', limit: 5 });
        expect(parseToolText(search).count).toBeGreaterThanOrEqual(1);
    });

    it('returns clear validation failure for bad add payload', async () => {
        const server = new AtlasForgeMcpServer(TEST_ROOT);
        await server.handleToolCall('af_init', {});
        await expect(server.handleToolCall('af_add_memory', { title: 'Only title' })).rejects.toThrow();
    });

    it('fails with clear errors for uninitialized repo and no active session', async () => {
        const uninitializedServer = new AtlasForgeMcpServer(TEST_ROOT);
        await expect(uninitializedServer.handleToolCall('af_status', {})).rejects.toThrow(/not initialized/i);

        const initializedServer = new AtlasForgeMcpServer(TEST_ROOT);
        await initializedServer.handleToolCall('af_init', {});
        await expect(initializedServer.handleToolCall('af_close_task', { summary: 'No session' })).rejects.toThrow(/no active session/i);
    });
});
