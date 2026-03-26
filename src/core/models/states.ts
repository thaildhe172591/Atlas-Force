export type QualityState = 'draft' | 'verified' | 'rejected';
export type LifecycleState = 'staging' | 'canonical' | 'stale' | 'deprecated';
export const MEMORY_TYPES = [
    'onboarding',
    'architecture',
    'module',
    'decision',
    'bugfix',
    'incident',
    'task-note',
    'policy',
    'convention',
    'code-pattern',
] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];
export type MemorySource = 'manual' | 'orchestrated' | 'imported' | 'generated';
export type Confidence = 'high' | 'medium' | 'low';
