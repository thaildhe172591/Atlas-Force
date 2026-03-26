import type { StagingStore } from '../store/staging.js';
import type { CanonicalStore } from '../store/canonical.js';
import type { FileSystemManager } from '../store/fs.js';
import type { AgentReadiness, StatusResult } from '../models/index.js';
import { DEFAULTS } from '../config/defaults.js';

export async function statusOperation(
    staging: StagingStore,
    canonical: CanonicalStore,
    _fsm: FileSystemManager,
    promotion = {
        configured_mode: DEFAULTS.promote_mode,
        effective_mode: DEFAULTS.promote_mode,
        migration_applied: false,
    },
    readiness: AgentReadiness
): Promise<StatusResult> {
    const sCount = (await staging.getAll()).length;
    const cCount = (await canonical.all()).length;
    return {
        snapshot: { staging_count: sCount, canonical_count: cCount, stale_count: 0 },
        promotion,
        agent_profile: readiness.agent_profile,
        agent_readiness_score: readiness.agent_readiness_score,
        level: readiness.level,
        gaps: readiness.gaps,
    };
}
