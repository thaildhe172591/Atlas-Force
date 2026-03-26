import * as crypto from 'node:crypto';
import { MemoryEntrySchema } from '../schemas/entry-schema.js';
import type { AddMemoryOptions, MemoryEntry } from '../models/index.js';
import type { StagingStore } from '../store/staging.js';
import { uuid7 } from '../utils/uuid.js';

export async function addOperation(
    options: AddMemoryOptions,
    staging: StagingStore
): Promise<MemoryEntry> {
    const now = new Date().toISOString();
    const record_id = uuid7();
    const memory_id = crypto.randomUUID();

    const modules = options.modules || [];
    const tags = options.tags || [];
    const inferred_fields: string[] = [];

    if (modules.length === 0 && options.files && options.files.length > 0) {
        const inferred = Array.from(new Set(options.files.map(f => {
            const parts = f.split(/[\\/]/);
            return parts.length > 1 ? parts[parts.length - 2] : 'root';
        })));
        modules.push(...inferred);
        inferred_fields.push('modules');
    }

    if (tags.length === 0) {
        const inferred = Array.from(new Set([...modules, options.memory_type]));
        tags.push(...inferred);
        inferred_fields.push('tags');
    }

    const entry: MemoryEntry = {
        record_id,
        memory_id,
        version: 1,
        memory_type: options.memory_type,
        title: options.title,
        summary: options.summary,
        what_changed: options.what_changed,
        why_it_matters: options.why_it_matters,
        modules,
        tags,
        inferred_fields,
        files: options.files || [],
        evidence_refs: options.evidence_refs || [],
        quality_state: 'draft',
        lifecycle_state: 'staging',
        source: 'manual',
        confidence: 'high',
        created_at: now,
        updated_at: now,
        metadata: { ...options.metadata }
    };

    MemoryEntrySchema.parse(entry);
    await staging.append(entry);
    return entry;
}
