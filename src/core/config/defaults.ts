import type { AtlasForgeConfig } from '../models/config.js';

export const DEFAULTS: AtlasForgeConfig = {
    ux: {
        default_mode: 'orchestrated',
        auto_preflight: true,
    },
    promote_mode: 'assisted',
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
