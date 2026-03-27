import type { AtlasForgeConfig } from '../models/config.js';

export const DEFAULTS: AtlasForgeConfig = {
    ux: {
        default_mode: 'orchestrated',
        auto_preflight: true,
    },
    promote_mode: 'direct',
    profile_mode: 'core',
    runtime_patch_state: {
        codex: 'required',
        claude: 'required',
        gemini: 'required',
    },
    storage: { root: '.atlasforge' },
    retrieval: { related_limit: 10 },
    dedupe: { near_duplicate_threshold: 0.85 },
    task: {
        digest_budget: {
            related_memories_max: 5,
            guardrails_max: 3
        }
    }
};
