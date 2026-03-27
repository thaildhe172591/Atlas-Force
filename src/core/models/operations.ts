import type { MemoryEntry } from './entry.js';
import type { MemoryType } from './states.js';
import type { TaskSession } from './task.js';
import type { DoctorResult } from './diagnostics.js';
import type { ProfileMode, PromotionModeHealth, RuntimePatchState } from './config.js';

export type AgentKind = 'claude' | 'gemini' | 'codex';
export type AgentSelection = AgentKind | 'auto' | 'all';
export type AgentConfidence = 'low' | 'medium' | 'high';
export type EntryArtifactKind =
    | 'shared-skill'
    | 'support-skill'
    | 'vendor-skill'
    | 'agent-guide'
    | 'command-template'
    | 'hook-template'
    | 'workflow-template'
    | 'bridge-template'
    | 'external-patch';
export type EntryArtifactStatus = 'created' | 'updated' | 'skipped' | 'drifted' | 'present' | 'missing';
export type EntryArtifactManagementTier = 'atlas-managed' | 'vendor-managed' | 'user-owned';
export type EntryArtifactInstallMode = 'repo-local-only' | 'external-patch' | 'guidance-only' | 'manual-install' | 'unsupported';
export type EntryArtifactConflictPolicy = 'preserve-user';
export type EntryArtifactMergeStrategy = 'replace-if-unmodified' | 'drift-report';
export type DecisionClass = 'architecture' | 'behavioral' | 'workflow';

export interface AgentProfile {
    requested_agent: AgentSelection;
    detected_agent: AgentKind;
    applied_agent: AgentKind;
    confidence: AgentConfidence;
    signals: string[];
}

export interface AgentReadiness {
    agent_profile: AgentProfile;
    profile: ProfileMode;
    selected_runtime: AgentKind;
    selected_runtime_ready: boolean;
    professional_kit_ready: boolean;
    runtimes: Record<AgentKind, { ready: boolean; patch_state: RuntimePatchState }>;
    runtime_readiness_dashboard: RuntimeReadinessDashboard;
    agent_readiness_score: number;
    level: 'basic' | 'good' | 'excellent';
    gaps: string[];
}

export interface RuntimeReadinessDashboard {
    selected: {
        agent: AgentKind;
        ready: boolean;
        patch_state: RuntimePatchState;
    };
    agents: Record<AgentKind, { ready: boolean; patch_state: RuntimePatchState }>;
    summary: {
        ready_count: number;
        total: number;
        not_ready: AgentKind[];
    };
}

export interface EntryArtifactMetadata {
    id: string;
    kind: EntryArtifactKind;
    display_name: string;
    path: string;
    agent_targets: AgentKind[];
    managed: boolean;
    management_tier: EntryArtifactManagementTier;
    atlas_owner: 'atlas' | 'vendor';
    generated_by: 'atlas-forge';
    version: string;
    status: EntryArtifactStatus;
    source_provenance: string;
    upstream_path?: string;
    install_mode: EntryArtifactInstallMode;
    conflict_policy: EntryArtifactConflictPolicy;
    merge_strategy: EntryArtifactMergeStrategy;
    invocation_aliases: string[];
}

export interface EntryLayerMetadata {
    entrypoints: EntryArtifactMetadata[];
    bridges: EntryArtifactMetadata[];
    external_patch_files: EntryArtifactMetadata[];
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
    decision_class?: DecisionClass;
    verified_change?: boolean;
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
    profile: ProfileMode;
    selected_runtime: AgentKind;
    selected_runtime_ready: boolean;
    professional_kit_ready: boolean;
    runtimes: Record<AgentKind, { ready: boolean; patch_state: RuntimePatchState }>;
    runtime_readiness_dashboard: RuntimeReadinessDashboard;
    agent_readiness_score: number;
    level: 'basic' | 'good' | 'excellent';
    gaps: string[];
    entrypoints: EntryArtifactMetadata[];
    bridges: EntryArtifactMetadata[];
    external_patch_files: EntryArtifactMetadata[];
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
    profile: ProfileMode;
    selected_runtime: AgentKind;
    selected_runtime_ready: boolean;
    professional_kit_ready: boolean;
    runtimes: Record<AgentKind, { ready: boolean; patch_state: RuntimePatchState }>;
    runtime_readiness_dashboard: RuntimeReadinessDashboard;
    agent_readiness_score: number;
    level: 'basic' | 'good' | 'excellent';
    gaps: string[];
    entrypoints: EntryArtifactMetadata[];
    bridges: EntryArtifactMetadata[];
    external_patch_files: EntryArtifactMetadata[];
}

export interface InitBootstrapReport extends EntryLayerMetadata {
    created: string[];
    updated: string[];
    skipped: string[];
    drifted: string[];
    dry_run?: boolean;
}
