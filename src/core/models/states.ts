export type QualityState = 'draft' | 'verified' | 'rejected';
export type LifecycleState = 'staging' | 'canonical' | 'stale' | 'deprecated';
export type MemoryType = 'onboarding' | 'architecture' | 'module' | 'decision' | 'bugfix' | 'incident' | 'task-note' | 'policy' | 'convention';
export type MemorySource = 'manual' | 'orchestrated' | 'imported' | 'generated';
export type Confidence = 'high' | 'medium' | 'low';
