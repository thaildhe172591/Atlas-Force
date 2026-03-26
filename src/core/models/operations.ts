import type { MemoryEntry } from './entry.js';
import type { MemoryType } from './states.js';
import type { TaskSession } from './task.js';
import type { DoctorResult } from './diagnostics.js';
import type { PromotionModeHealth } from './config.js';

export type AgentKind = 'claude' | 'gemini' | 'codex';
export type AgentSelection = AgentKind | 'auto';
export type AgentConfidence = 'low' | 'medium' | 'high';

export interface AgentProfile {
    requested_agent: AgentSelection;
    detected_agent: AgentKind;
    applied_agent: AgentKind;
    confidence: AgentConfidence;
    signals: string[];
}

export interface AgentReadiness {
    agent_profile: AgentProfile;
    agent_readiness_score: number;
    level: 'basic' | 'good' | 'excellent';
    gaps: string[];
}

export interface AddMemoryOptions {
    memory_type: MemoryType;
    title: string;
    summary: string;
    what_changed: string;
    why_it_matters: string;
    modules?: string[];
    tags?: string[];
    files?: string[];
    evidence_refs?: any[];
    metadata?: Record<string, any>;
}

export interface TaskStartOptions {
    summary: string;
    modules_hint?: string[];
    files_hint?: string[];
    skip_preflight?: boolean;
}

export interface TaskStartResult {
    session: TaskSession;
    preflight: {
        onboarding?: string;
        architecture_map?: string;
        module_map?: string;
        handoff_context?: string;
        related_memories?: any[];
    };
}

export interface TaskCloseOptions {
    summary: string;
    memory_type?: MemoryType;
    what_changed?: string;
    why_it_matters?: string;
    modules?: string[];
    tags?: string[];
    promote_mode?: 'assisted' | 'manual' | 'direct';
}

export interface TaskCloseResult {
    session: TaskSession;
    promoted_entries: MemoryEntry[];
    skipped_entries: MemoryEntry[];
    doctor: DoctorResult;
}

export interface ReindexResult {
    indexes_updated: string[];
    current_state_updated: boolean;
    entries_processed: number;
}

export interface StatusSnapshot {
    staging_count: number;
    canonical_count: number;
    stale_count: number;
    last_reindex_at?: string;
}

export interface StatusResult {
    snapshot: StatusSnapshot;
    promotion: PromotionModeHealth;
    agent_profile: AgentProfile;
    agent_readiness_score: number;
    level: 'basic' | 'good' | 'excellent';
    gaps: string[];
}

export interface PromoteOptions {
    entry_ids?: string[];
}

export interface PromoteResult {
    mode: 'assisted' | 'manual' | 'direct';
    promoted: MemoryEntry[];
    skipped: MemoryEntry[];
    reason_map: Record<string, string>;
}

export interface SearchOptions {
    query: string;
    limit?: number;
    memory_type?: MemoryType;
}

export interface VerifyCheck {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
}

export interface VerifyResult {
    ok: boolean;
    root: string;
    checks: VerifyCheck[];
    promotion: PromotionModeHealth;
    agent_profile: AgentProfile;
    agent_readiness_score: number;
    level: 'basic' | 'good' | 'excellent';
    gaps: string[];
}

export interface InitBootstrapReport {
    created: string[];
    skipped: string[];
    dry_run?: boolean;
}
