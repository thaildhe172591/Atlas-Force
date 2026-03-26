import { z } from 'zod';
import { MEMORY_TYPES } from '../models/states.js';

export const FileEvidenceSchema = z.object({
    type: z.literal('file'),
    path: z.string().min(1),
    line_start: z.number().int().positive().optional(),
    line_end: z.number().int().positive().optional(),
    label: z.string().optional(),
});

export const EvidenceRefSchema = z.discriminatedUnion('type', [
    FileEvidenceSchema,
    z.object({ type: z.literal('commit'), sha: z.string().min(1), label: z.string().optional() }),
    z.object({ type: z.literal('url'), url: z.string().min(1), label: z.string().optional() }),
    z.object({ type: z.literal('conversation'), ref: z.string().min(1), label: z.string().optional() }),
]);

export const FreshnessPolicySchema = z.object({
    mode: z.enum(['age', 'file_change_or_age', 'manual']),
    max_age_days: z.number().positive().optional(),
    watch_files: z.array(z.string()).optional(),
    review_trigger: z.enum(['auto', 'manual']),
});

export const MemoryEntrySchema = z.object({
    record_id: z.string(),
    memory_id: z.string(),
    version: z.number().int().positive(),
    supersedes_record_id: z.string().optional(),
    memory_type: z.enum(MEMORY_TYPES),
    title: z.string().min(1),
    summary: z.string().min(1),
    what_changed: z.string().min(1),
    why_it_matters: z.string().min(1),
    modules: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    files: z.array(z.string()).default([]),
    evidence_refs: z.array(EvidenceRefSchema).default([]),
    source: z.enum(['manual', 'orchestrated', 'imported', 'generated']),
    confidence: z.enum(['high', 'medium', 'low']),
    inferred_fields: z.array(z.string()).default([]),
    quality_state: z.enum(['draft', 'verified', 'rejected']),
    lifecycle_state: z.enum(['staging', 'canonical', 'stale', 'deprecated']),
    created_at: z.string(),
    updated_at: z.string(),
    freshness_policy: FreshnessPolicySchema.optional(),
    metadata: z.record(z.string(), z.unknown()).default({}),
});
