import { z } from 'zod';
export const AtlasForgeConfigSchema = z.object({
    ux: z.object({
        default_mode: z.enum(['orchestrated', 'manual']).default('orchestrated'),
        auto_preflight: z.boolean().default(true),
    }).default({ default_mode: 'orchestrated', auto_preflight: true }),
    promote_mode: z.enum(['assisted', 'manual', 'direct']).default('assisted'),
    storage: z.object({ root: z.string().default('.atlasforge') }).default({ root: '.atlasforge' }),
    retrieval: z.object({ related_limit: z.number().int().positive().default(10) }).default({ related_limit: 10 }),
    dedupe: z.object({ near_duplicate_threshold: z.number().min(0).max(1).default(0.85) }).default({ near_duplicate_threshold: 0.85 }),
    task: z.object({
        digest_budget: z.object({
            related_memories_max: z.number().int().positive().default(5),
            guardrails_max: z.number().int().positive().default(3)
        }).default({ related_memories_max: 5, guardrails_max: 3 })
    }).default({ digest_budget: { related_memories_max: 5, guardrails_max: 3 } }),
});
