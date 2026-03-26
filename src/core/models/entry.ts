import type { QualityState, LifecycleState, MemoryType, MemorySource, Confidence } from './states.js';

export type EvidenceRef =
    | { type: 'file'; path: string; line_start?: number; line_end?: number; label?: string }
    | { type: 'commit'; sha: string; label?: string }
    | { type: 'url'; url: string; label?: string }
    | { type: 'conversation'; ref: string; label?: string };

export interface FreshnessPolicy {
    mode: 'age' | 'file_change_or_age' | 'manual';
    max_age_days?: number;
    watch_files?: string[];
    review_trigger: 'auto' | 'manual';
}

export interface MemoryEntry {
    record_id: string;
    memory_id: string;
    version: number;
    supersedes_record_id?: string;
    memory_type: MemoryType;
    title: string;
    summary: string;
    what_changed: string;
    why_it_matters: string;
    modules: string[];
    tags: string[];
    files: string[];
    evidence_refs: EvidenceRef[];
    source: MemorySource;
    confidence: Confidence;
    inferred_fields?: string[];
    quality_state: QualityState;
    lifecycle_state: LifecycleState;
    created_at: string;
    updated_at: string;
    freshness_policy?: FreshnessPolicy;
    metadata: Record<string, unknown>;
}
