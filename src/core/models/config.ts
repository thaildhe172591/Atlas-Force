export interface AtlasForgeConfig {
    ux: {
        default_mode: 'orchestrated' | 'manual';
        auto_preflight: boolean;
    };
    promote_mode: 'assisted' | 'manual' | 'direct';
    storage: { root: string };
    retrieval: { related_limit: number };
    dedupe: { near_duplicate_threshold: number };
    task: { digest_budget: { related_memories_max: number; guardrails_max: number } };
}
