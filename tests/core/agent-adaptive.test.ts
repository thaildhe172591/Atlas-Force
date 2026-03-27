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
        expect(status.profile).toBe('core');
        expect(status.selected_runtime).toBe('codex');
        expect(status.agent_readiness_score).toBeGreaterThan(0);
        expect(['basic', 'good', 'excellent']).toContain(status.level);
        expect(status.runtime_readiness_dashboard.selected.agent).toBe('codex');
        expect(status.runtime_readiness_dashboard.summary.total).toBe(3);
        expect(status.entrypoints.some((artifact) => artifact.id === 'atlas-forge-skill')).toBe(true);
    });

    it('reports gaps when required artifacts are missing', async () => {
        await AtlasForge.initWithReport(testRoot, 'gemini');
        fs.rmSync(path.join(testRoot, 'GEMINI.md'));
        const readiness = evaluateAgentReadiness(testRoot, 'gemini', true);
        expect(readiness.gaps.some((gap) => gap.includes('GEMINI.md'))).toBe(true);
    });

    it('keeps detection semantics in all mode while generating all artifacts', async () => {
        const { forge } = await AtlasForge.initWithReport(testRoot, 'all');
        const status = await forge.status('all');
        expect(status.agent_profile.requested_agent).toBe('all');
        expect(status.profile).toBe('professional');
        expect(['claude', 'gemini', 'codex']).toContain(status.agent_profile.applied_agent);
        expect(status.external_patch_files.length).toBeGreaterThanOrEqual(3);
    }, 15000);

    it('treats skipped runtime patch state as deterministic readiness signal', async () => {
        await AtlasForge.initWithReport(testRoot, 'all');
        const configPath = path.join(testRoot, '.atlasforge', 'config.yaml');
        let config = fs.readFileSync(configPath, 'utf-8');
        config = config.replace('claude: required', 'claude: skipped');
        fs.writeFileSync(configPath, config, 'utf-8');
        fs.rmSync(path.join(testRoot, '.atlasforge', 'install', 'claude', 'claude-desktop-config.patch.json'));

        const verify = await AtlasForge.verify(testRoot, 'claude');
        expect(verify.selected_runtime).toBe('claude');
        expect(verify.runtimes.claude.patch_state).toBe('skipped');
        expect(verify.selected_runtime_ready).toBe(true);
        expect(verify.runtime_readiness_dashboard.selected.patch_state).toBe('skipped');
    });
});
