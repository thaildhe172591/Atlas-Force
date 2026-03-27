import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import { AtlasForgeConfigSchema } from '../schemas/config.js';
import { DEFAULTS } from './defaults.js';
import type { AtlasForgeConfig, ConfigLoadResult } from '../models/config.js';

function normalizeRuntimePatchState(value: unknown): AtlasForgeConfig['runtime_patch_state']['codex'] {
    if (value === 'required' || value === 'applied' || value === 'skipped') {
        return value;
    }
    return 'required';
}

function sanitizeRawConfig(raw: Record<string, unknown>): Record<string, unknown> {
    const normalized = { ...raw };
    const rawProfileMode = normalized.profile_mode;
    if (rawProfileMode !== 'core' && rawProfileMode !== 'professional') {
        normalized.profile_mode = DEFAULTS.profile_mode;
    }

    const runtimePatchRaw =
        normalized.runtime_patch_state && typeof normalized.runtime_patch_state === 'object'
            ? (normalized.runtime_patch_state as Record<string, unknown>)
            : {};
    normalized.runtime_patch_state = {
        codex: normalizeRuntimePatchState(runtimePatchRaw.codex),
        claude: normalizeRuntimePatchState(runtimePatchRaw.claude),
        gemini: normalizeRuntimePatchState(runtimePatchRaw.gemini),
    };

    return normalized;
}

export class ConfigLoader {
    static async load(root: string): Promise<AtlasForgeConfig> {
        const result = await this.loadWithMeta(root);
        return result.config;
    }

    static async loadWithMeta(root: string): Promise<ConfigLoadResult> {
        try {
            return this.loadInternal(root);
        } catch {
            return {
                config: DEFAULTS,
                promotion_health: {
                    configured_mode: DEFAULTS.promote_mode,
                    effective_mode: DEFAULTS.promote_mode,
                    migration_applied: false,
                },
            };
        }
    }

    static async loadStrictWithMeta(root: string): Promise<ConfigLoadResult> {
        return this.loadInternal(root);
    }

    private static loadInternal(root: string): ConfigLoadResult {
        const configPath = path.join(root, '.atlasforge', 'config.yaml');
        if (!fs.existsSync(configPath)) {
            return {
                config: DEFAULTS,
                promotion_health: {
                    configured_mode: DEFAULTS.promote_mode,
                    effective_mode: DEFAULTS.promote_mode,
                    migration_applied: false,
                },
            };
        }

        const content = fs.readFileSync(configPath, 'utf-8');
        const parsed = yaml.parse(content);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('config.yaml must contain a YAML object');
        }

        const raw = { ...(parsed as Record<string, unknown>) };
        const configuredMode = raw.promote_mode === 'assisted' || raw.promote_mode === 'manual' || raw.promote_mode === 'direct'
            ? raw.promote_mode
            : DEFAULTS.promote_mode;

        const legacyAssisted = raw.promote_mode === 'assisted';
        if (legacyAssisted) {
            raw.promote_mode = 'direct';
        }

        const config = AtlasForgeConfigSchema.parse({ ...DEFAULTS, ...sanitizeRawConfig(raw) }) as AtlasForgeConfig;
        if (legacyAssisted) {
            fs.writeFileSync(configPath, yaml.stringify(config), 'utf-8');
        }

        return {
            config,
            promotion_health: {
                configured_mode: configuredMode,
                effective_mode: config.promote_mode,
                migration_applied: legacyAssisted,
                migration_note: legacyAssisted ? 'Legacy promote_mode=assisted was auto-migrated to direct.' : undefined,
            },
        };
    }
}
