import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { detectAgentProfile, evaluateAgentReadiness } from '../../src/core/config/agent-ready.js';
import { AtlasForge } from '../../src/core/facade.js';

describe('Adaptive agent detection + readiness', () => {
    const testRoot = path.resolve('.test-agent-adaptive');

    beforeEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
        fs.mkdirSync(testRoot, { recursive: true });
    });

    afterEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
    });

    it('falls back to codex with low confidence when no agent signals exist', () => {
        const profile = detectAgentProfile(testRoot, 'auto');
        expect(profile.detected_agent).toBe('codex');
        expect(profile.applied_agent).toBe('codex');
        expect(profile.confidence).toBe('low');
    });

    it('detects claude from CLAUDE + MCP config signals', () => {
        fs.writeFileSync(path.join(testRoot, 'CLAUDE.md'), '# claude\n', 'utf-8');
        fs.mkdirSync(path.join(testRoot, '.claude'), { recursive: true });
        fs.writeFileSync(
            path.join(testRoot, '.claude', 'settings.json'),
            JSON.stringify({ mcpServers: { 'atlas-forge': { command: 'npx', args: ['atlas-forge-mcp'] } } }, null, 2),
            'utf-8'
        );
        const profile = detectAgentProfile(testRoot, 'auto');
        expect(profile.detected_agent).toBe('claude');
        expect(profile.confidence).toMatch(/medium|high/);
    });

    it('computes readiness score and level for bootstrapped codex workspace', async () => {
        const { forge } = await AtlasForge.initWithReport(testRoot, 'codex');
        const status = await forge.status('codex');
        expect(status.agent_profile.applied_agent).toBe('codex');
        expect(status.agent_readiness_score).toBeGreaterThan(0);
        expect(['basic', 'good', 'excellent']).toContain(status.level);
    });

    it('reports gaps when required artifacts are missing', async () => {
        await AtlasForge.initWithReport(testRoot, 'gemini');
        fs.rmSync(path.join(testRoot, 'GEMINI.md'));
        const readiness = evaluateAgentReadiness(testRoot, 'gemini', true);
        expect(readiness.gaps.some((gap) => gap.includes('GEMINI.md'))).toBe(true);
    });
});
