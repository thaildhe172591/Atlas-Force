import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AgentSelection, VerifyCheck, VerifyResult } from '../models/index.js';
import { ConfigLoader, DEFAULTS, evaluateAgentReadiness, getEntryLayerMetadata } from '../config/index.js';

export async function verifyOperation(root: string, requestedAgent: AgentSelection = 'auto'): Promise<VerifyResult> {
    const checks: VerifyCheck[] = [];
    const atlasRoot = path.join(root, '.atlasforge');
    const requiredDirs = ['staging', 'canonical', 'indexes', 'sessions'];
    const optionalIndexFiles = ['onboarding.md', 'architecture-map.md', 'module-map.md'];

    if (fs.existsSync(atlasRoot)) {
        checks.push({ name: 'root', status: 'pass', message: '.atlasforge directory exists' });
    } else {
        checks.push({ name: 'root', status: 'fail', message: '.atlasforge directory is missing. Run `atlas-forge init`.' });
    }

    for (const dir of requiredDirs) {
        const dirPath = path.join(atlasRoot, dir);
        if (fs.existsSync(dirPath)) {
            checks.push({ name: `dir:${dir}`, status: 'pass', message: `${dir} directory is present` });
        } else {
            checks.push({ name: `dir:${dir}`, status: 'fail', message: `${dir} directory is missing` });
        }
    }

    const configPath = path.join(atlasRoot, 'config.yaml');
    let promotion = {
        configured_mode: DEFAULTS.promote_mode,
        effective_mode: DEFAULTS.promote_mode,
        migration_applied: false,
    } as VerifyResult['promotion'];

    if (!fs.existsSync(configPath)) {
        checks.push({ name: 'config', status: 'fail', message: 'config.yaml is missing' });
    } else {
        try {
            const load = await ConfigLoader.loadStrictWithMeta(root);
            promotion = load.promotion_health;
            checks.push({ name: 'config', status: 'pass', message: 'config.yaml is readable and valid' });
            if (promotion.migration_applied) {
                checks.push({
                    name: 'promote-mode',
                    status: 'warn',
                    message: promotion.migration_note || 'Legacy promote_mode=assisted was auto-migrated to direct.',
                });
            } else {
                checks.push({
                    name: 'promote-mode',
                    status: 'pass',
                    message: `promote_mode is ${promotion.effective_mode}`,
                });
            }
            checks.push({
                name: 'profile-mode',
                status: 'pass',
                message: `profile_mode is ${load.config.profile_mode}`,
            });
            checks.push({
                name: 'runtime-patch-state',
                status: 'pass',
                message: `runtime_patch_state: codex=${load.config.runtime_patch_state.codex}, claude=${load.config.runtime_patch_state.claude}, gemini=${load.config.runtime_patch_state.gemini}`,
            });
        } catch (err: any) {
            checks.push({ name: 'config', status: 'fail', message: `config.yaml is invalid: ${err.message}` });
        }
    }

    const indexRoot = path.join(atlasRoot, 'indexes');
    for (const file of optionalIndexFiles) {
        const p = path.join(indexRoot, file);
        if (fs.existsSync(p)) {
            checks.push({ name: `index:${file}`, status: 'pass', message: `${file} is present` });
        } else {
            checks.push({
                name: `index:${file}`,
                status: 'warn',
                message: `${file} is missing. This is optional but recommended for better agent grounding.`,
            });
        }
    }

    const mcpBinPath = path.join(root, 'dist', 'mcp', 'bin.js');
    if (fs.existsSync(mcpBinPath)) {
        checks.push({ name: 'mcp-binary', status: 'pass', message: 'MCP binary is available at dist/mcp/bin.js' });
    } else {
        checks.push({
            name: 'mcp-binary',
            status: 'warn',
            message: 'MCP binary not found at dist/mcp/bin.js in this workspace. Run `npm run build` for local verification.',
        });
    }

    const ok = !checks.some((c) => c.status === 'fail');
    const readiness = evaluateAgentReadiness(root, requestedAgent, ok, promotion);
    const entryLayer = getEntryLayerMetadata(root, requestedAgent);
    return {
        ok,
        root,
        checks,
        promotion,
        agent_profile: readiness.agent_profile,
        profile: readiness.profile,
        selected_runtime: readiness.selected_runtime,
        selected_runtime_ready: readiness.selected_runtime_ready,
        professional_kit_ready: readiness.professional_kit_ready,
        runtimes: readiness.runtimes,
        runtime_readiness_dashboard: readiness.runtime_readiness_dashboard,
        agent_readiness_score: readiness.agent_readiness_score,
        level: readiness.level,
        gaps: readiness.gaps,
        entrypoints: entryLayer.entrypoints,
        bridges: entryLayer.bridges,
        external_patch_files: entryLayer.external_patch_files,
    };
}
