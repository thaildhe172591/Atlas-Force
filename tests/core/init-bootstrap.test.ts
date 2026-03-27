import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AtlasForge } from '../../src/core/facade.js';

describe('Init bootstrap + promotion migration', () => {
    const testRoot = path.resolve('.test-init-bootstrap');

    beforeEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
    });

    afterEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
    });

    it('creates profile-specific root guidance and core assets on fresh init', async () => {
        const { bootstrap, agent_profile } = await AtlasForge.initWithReport(testRoot, 'gemini');

        expect(fs.existsSync(path.join(testRoot, 'AGENTS.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, 'GEMINI.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'skills', 'atlas-forge.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'commands', 'init-scan.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'bridges', 'atlas-forge+gemini-kit.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'install', 'gemini', 'gemini-commands.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'skills', 'clean-code.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'skills', 'brainstorming.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'skills', 'workflow.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'workflows', 'task-lifecycle.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'workflows', 'quickstart-gemini.md'))).toBe(true);

        expect(bootstrap.created).toContain('AGENTS.md');
        expect(bootstrap.created).toContain('GEMINI.md');
        expect(bootstrap.created).toContain('.atlasforge/skills/atlas-forge.md');
        expect(bootstrap.created).toContain('.atlasforge/commands/init-scan.md');
        expect(bootstrap.created).toContain('.atlasforge/bridges/atlas-forge+gemini-kit.md');
        expect(bootstrap.created).toContain('.atlasforge/install/gemini/gemini-commands.md');
        expect(bootstrap.created).toContain('.atlasforge/skills/clean-code.md');
        expect(bootstrap.created).toContain('.atlasforge/skills/brainstorming.md');
        expect(bootstrap.created).toContain('.atlasforge/skills/workflow.md');
        expect(bootstrap.created).toContain('.atlasforge/workflows/task-lifecycle.md');
        expect(bootstrap.created).toContain('.atlasforge/workflows/quickstart-gemini.md');
        expect(agent_profile.applied_agent).toBe('gemini');

        const config = fs.readFileSync(path.join(testRoot, '.atlasforge', 'config.yaml'), 'utf-8');
        expect(config).toContain('promote_mode: direct');
        expect(bootstrap.entrypoints.some((artifact) => artifact.id === 'atlas-forge-skill')).toBe(true);
        expect(bootstrap.bridges.some((artifact) => artifact.id === 'atlas-forge-bridge-gemini-kit')).toBe(true);
        expect(bootstrap.external_patch_files.some((artifact) => artifact.id === 'atlas-forge-install-gemini-commands')).toBe(true);
        const sharedSkill = bootstrap.entrypoints.find((artifact) => artifact.id === 'atlas-forge-skill');
        expect(sharedSkill?.management_tier).toBe('atlas-managed');
        expect(sharedSkill?.atlas_owner).toBe('atlas');
        expect(sharedSkill?.conflict_policy).toBe('preserve-user');
    });

    it('does not overwrite existing agent bootstrap files', async () => {
        await AtlasForge.initWithReport(testRoot);

        const sharedPath = path.join(testRoot, 'AGENTS.md');
        const geminiPath = path.join(testRoot, 'GEMINI.md');
        const cleanCodePath = path.join(testRoot, '.atlasforge', 'skills', 'clean-code.md');
        fs.writeFileSync(sharedPath, '# custom shared\n', 'utf-8');
        fs.writeFileSync(geminiPath, '# custom gemini\n', 'utf-8');
        fs.writeFileSync(cleanCodePath, '# custom clean-code\n', 'utf-8');

        const { bootstrap } = await AtlasForge.initWithReport(testRoot);
        expect(bootstrap.skipped).toContain('AGENTS.md');
        expect(bootstrap.skipped).toContain('GEMINI.md');
        expect(bootstrap.skipped).toContain('.atlasforge/skills/clean-code.md');
        expect(fs.readFileSync(sharedPath, 'utf-8')).toBe('# custom shared\n');
        expect(fs.readFileSync(geminiPath, 'utf-8')).toBe('# custom gemini\n');
        expect(fs.readFileSync(cleanCodePath, 'utf-8')).toBe('# custom clean-code\n');
    });

    it('auto-migrates legacy promote_mode assisted to direct', async () => {
        const afDir = path.join(testRoot, '.atlasforge');
        fs.mkdirSync(afDir, { recursive: true });
        fs.writeFileSync(path.join(afDir, 'config.yaml'), 'promote_mode: assisted\n', 'utf-8');

        const { forge } = await AtlasForge.initWithReport(testRoot);
        expect(forge.config.promote_mode).toBe('direct');
        expect(forge.promotion_health.migration_applied).toBe(true);

        const configAfter = fs.readFileSync(path.join(afDir, 'config.yaml'), 'utf-8');
        expect(configAfter).toContain('promote_mode: direct');

        const verify = await AtlasForge.verify(testRoot);
        expect(verify.promotion.effective_mode).toBe('direct');
        expect(verify.checks.some((check) => check.name === 'promote-mode')).toBe(true);
    });

    it('supports optimize dry-run without writing missing files', async () => {
        await AtlasForge.initWithReport(testRoot, 'codex');
        fs.rmSync(path.join(testRoot, 'CODEX.md'));

        const { bootstrap, agent_profile } = await AtlasForge.optimizeWithReport(testRoot, 'codex', true);
        expect(agent_profile.applied_agent).toBe('codex');
        expect(bootstrap.dry_run).toBe(true);
        expect(bootstrap.created).toContain('CODEX.md');
        expect(fs.existsSync(path.join(testRoot, 'CODEX.md'))).toBe(false);
    });

    it('creates the full entry layer for --agent all', async () => {
        const { bootstrap, agent_profile } = await AtlasForge.initWithReport(testRoot, 'all');

        expect(agent_profile.requested_agent).toBe('all');
        expect(fs.existsSync(path.join(testRoot, 'AGENTS.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, 'CLAUDE.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, 'GEMINI.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, 'CODEX.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'commands', 'feature.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'bridges', 'atlas-forge+superpower.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'install', 'claude', 'claude-desktop-config.patch.json'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'install', 'codex', 'atlas-forge-skill.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'install', 'gemini', 'gemini-commands.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'skills', 'superpowers', 'brainstorming.md'))).toBe(true);
        expect(fs.existsSync(path.join(testRoot, '.atlasforge', 'skills', 'superpowers', 'writing-skills.md'))).toBe(false);
        expect(bootstrap.entrypoints.some((artifact) => artifact.id === 'atlas-forge-command-feature')).toBe(true);
        expect(bootstrap.bridges.some((artifact) => artifact.id === 'atlas-forge-bridge-superpower')).toBe(true);
        expect(bootstrap.external_patch_files.some((artifact) => artifact.id === 'atlas-forge-install-claude-config')).toBe(true);
        const config = fs.readFileSync(path.join(testRoot, '.atlasforge', 'config.yaml'), 'utf-8');
        expect(config).toContain('profile_mode: professional');
    });
});
