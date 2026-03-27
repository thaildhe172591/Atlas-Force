import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ConfigLoader } from '../../src/core/config/loader.js';
import { AtlasForge } from '../../src/core/facade.js';

describe('Config migration edge-cases for legacy repositories', () => {
    const testRoot = path.resolve('.test-config-migration-edge');
    const afDir = path.join(testRoot, '.atlasforge');

    beforeEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
        fs.mkdirSync(afDir, { recursive: true });
    });

    afterEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
    });

    it('migrates assisted mode in large legacy config and rewrites canonical config', async () => {
        const legacyBlocks = Array.from({ length: 250 }, (_, i) => `  module_${i}: legacy_${i}`).join('\n');
        const legacyConfig = `promote_mode: assisted\nux:\n  default_mode: manual\n  auto_preflight: false\nlegacy_modules:\n${legacyBlocks}\n`;
        fs.writeFileSync(path.join(afDir, 'config.yaml'), legacyConfig, 'utf-8');

        const load = await ConfigLoader.loadStrictWithMeta(testRoot);
        expect(load.promotion_health.migration_applied).toBe(true);
        expect(load.promotion_health.configured_mode).toBe('assisted');
        expect(load.config.promote_mode).toBe('direct');
        expect(load.config.profile_mode).toBe('core');
        expect(load.config.runtime_patch_state.codex).toBe('required');

        const rewritten = fs.readFileSync(path.join(afDir, 'config.yaml'), 'utf-8');
        expect(rewritten).toContain('promote_mode: direct');
        expect(rewritten).not.toContain('legacy_modules:');
    });

    it('normalizes invalid legacy runtime patch states instead of failing migration', async () => {
        fs.writeFileSync(
            path.join(afDir, 'config.yaml'),
            [
                'promote_mode: assisted',
                'profile_mode: legacy-profile',
                'runtime_patch_state:',
                '  codex: pending',
                '  claude: unknown',
                '  gemini: applied',
                '',
            ].join('\n'),
            'utf-8'
        );

        const load = await ConfigLoader.loadStrictWithMeta(testRoot);
        expect(load.promotion_health.migration_applied).toBe(true);
        expect(load.config.promote_mode).toBe('direct');
        expect(load.config.profile_mode).toBe('core');
        expect(load.config.runtime_patch_state.codex).toBe('required');
        expect(load.config.runtime_patch_state.claude).toBe('required');
        expect(load.config.runtime_patch_state.gemini).toBe('applied');
    });

    it('keeps verify deterministic for malformed legacy config content', async () => {
        for (const dir of ['staging', 'canonical', 'indexes', 'sessions']) {
            fs.mkdirSync(path.join(afDir, dir), { recursive: true });
        }
        fs.writeFileSync(path.join(afDir, 'config.yaml'), '- malformed\n- config\n', 'utf-8');

        const verify = await AtlasForge.verify(testRoot, 'codex');
        const configCheck = verify.checks.find((check) => check.name === 'config');
        expect(configCheck?.status).toBe('fail');
        expect(verify.ok).toBe(false);
        expect(verify.gaps.some((gap) => gap.includes('workspace verification failed'))).toBe(true);
    });
});
