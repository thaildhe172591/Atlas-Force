export type ProfileMode = 'core' | 'professional';
export type RuntimePatchState = 'required' | 'applied' | 'skipped';

export interface AtlasForgeConfig {
    ux: {
        default_mode: 'orchestrated' | 'manual';
        auto_preflight: boolean;
    };
    promote_mode: 'assisted' | 'manual' | 'direct';
    profile_mode: ProfileMode;
    runtime_patch_state: {
        codex: RuntimePatchState;
        claude: RuntimePatchState;
        gemini: RuntimePatchState;
    };
    storage: { root: string };
    retrieval: { related_limit: number };
    dedupe: { near_duplicate_threshold: number };
    task: { digest_budget: { related_memories_max: number; guardrails_max: number } };
}

export interface PromotionModeHealth {
    configured_mode: 'assisted' | 'manual' | 'direct';
    effective_mode: 'assisted' | 'manual' | 'direct';
    migration_applied: boolean;
    migration_note?: string;
}

export interface ConfigLoadResult {
    config: AtlasForgeConfig;
    promotion_health: PromotionModeHealth;
}
