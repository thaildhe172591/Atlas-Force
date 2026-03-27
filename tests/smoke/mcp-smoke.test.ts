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
        const server = new AtlasForgeMcpServer(TEST_ROOT);

        const init = await server.handleToolCall('af_init', { agent: 'claude' });
        const initPayload = parseToolText(init);
        expect(initPayload.ok).toBe(true);
        expect(initPayload.agent_profile.applied_agent).toBe('claude');
        expect(Array.isArray(initPayload.bootstrap.created)).toBe(true);
        expect(Array.isArray(initPayload.bootstrap.entrypoints)).toBe(true);
        expect(Array.isArray(initPayload.bootstrap.bridges)).toBe(true);
        expect(Array.isArray(initPayload.bootstrap.external_patch_files)).toBe(true);

        const start = await server.handleToolCall('af_start_task', { summary: 'MCP smoke task' });
        expect(parseToolText(start).session.status).toBe('active');

        const add = await server.handleToolCall('af_add_memory', {
            type: 'code-pattern',
            title: 'Pattern A',
            summary: 'Pattern memory',
        });
        expect(parseToolText(add).entry.memory_type).toBe('code-pattern');

        const status = await server.handleToolCall('af_status', {});
        const statusPayload = parseToolText(status);
        expect(statusPayload.snapshot.staging_count).toBeGreaterThan(0);
        expect(statusPayload.promotion.effective_mode).toBe('direct');
        expect(statusPayload.agent_profile.applied_agent).toBe('claude');
        expect(['core', 'professional']).toContain(statusPayload.profile);
        expect(typeof statusPayload.selected_runtime_ready).toBe('boolean');
        expect(typeof statusPayload.professional_kit_ready).toBe('boolean');
        expect(statusPayload.runtimes).toBeTruthy();
        expect(statusPayload.runtime_readiness_dashboard).toBeTruthy();
        expect(statusPayload.runtime_readiness_dashboard.summary.total).toBe(3);
        expect(typeof statusPayload.agent_readiness_score).toBe('number');
        expect(Array.isArray(statusPayload.entrypoints)).toBe(true);
        expect(Array.isArray(statusPayload.bridges)).toBe(true);
        expect(Array.isArray(statusPayload.external_patch_files)).toBe(true);

        const close = await server.handleToolCall('af_close_task', { summary: 'MCP smoke done' });
        const closePayload = parseToolText(close);
        expect(closePayload.session.status).toBe('closed');
        expect(closePayload.promoted_count).toBeGreaterThan(0);

        const statusAfterClose = await server.handleToolCall('af_status', {});
        expect(parseToolText(statusAfterClose).snapshot.canonical_count).toBeGreaterThan(0);

        const search = await server.handleToolCall('af_search', { query: 'Pattern', limit: 5 });
        expect(parseToolText(search).count).toBeGreaterThanOrEqual(1);
    });

    it('returns clear validation failure for bad add payload', async () => {
        const server = new AtlasForgeMcpServer(TEST_ROOT);
        await server.handleToolCall('af_init', { agent: 'codex' });
        await expect(server.handleToolCall('af_add_memory', { title: 'Only title' })).rejects.toThrow();
    });

    it('fails with clear errors for uninitialized repo and no active session', async () => {
        const uninitializedServer = new AtlasForgeMcpServer(TEST_ROOT);
        await expect(uninitializedServer.handleToolCall('af_status', {})).rejects.toThrow(/not initialized/i);

        const initializedServer = new AtlasForgeMcpServer(TEST_ROOT);
        await initializedServer.handleToolCall('af_init', { agent: 'gemini' });
        await expect(initializedServer.handleToolCall('af_close_task', { summary: 'No session' })).rejects.toThrow(/no active session/i);
    });

    it('accepts agent=all during MCP init', async () => {
        const server = new AtlasForgeMcpServer(TEST_ROOT);
        const init = await server.handleToolCall('af_init', { agent: 'all' });
        const payload = parseToolText(init);
        expect(payload.agent_profile.requested_agent).toBe('all');
        expect(payload.bootstrap.external_patch_files.length).toBeGreaterThanOrEqual(3);
    });
});
