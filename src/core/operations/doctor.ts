import { MemoryEntrySchema } from '../schemas/entry-schema.js';
import type { DoctorOptions, DoctorResult, DoctorCheck } from '../models/index.js';
import type { StagingStore } from '../store/staging.js';
import type { FileSystemManager } from '../store/fs.js';

export async function doctorOperation(
    options: DoctorOptions,
    staging: StagingStore,
    fsm: FileSystemManager
): Promise<DoctorResult> {
    const allEntries = await staging.getAll();
    const toValidate = options.entry_ids ? allEntries.filter(e => options.entry_ids!.includes(e.record_id)) : allEntries;

    const checks: DoctorCheck[] = [];
    const stats = { pass: 0, warn: 0, fail: 0 };

    for (const entry of toValidate) {
        // 1. Schema Validation
        const result = MemoryEntrySchema.safeParse(entry);
        if (!result.success) {
            stats.fail++;
            checks.push({ name: 'schema', entry_id: entry.record_id, status: 'fail', message: `Schema mismatch: ${result.error.message}` });
            continue;
        }

        // 2. Duplicate Detection (within staging)
        const isDup = allEntries.some(e => e.record_id !== entry.record_id && e.title === entry.title && e.summary === entry.summary);
        if (isDup) {
            stats.warn++;
            checks.push({ name: 'duplicate', entry_id: entry.record_id, status: 'warn', message: 'Potential duplicate found in staging (title + summary overlap)' });
        }

        // 3. Evidence Validation
        if (entry.evidence_refs.length === 0) {
            stats.warn++;
            checks.push({ name: 'evidence', entry_id: entry.record_id, status: 'warn', message: 'No evidence attached' });
        } else {
            for (const ref of entry.evidence_refs) {
                if (ref.type === 'file') {
                    if (!fsm.existsSync(ref.path)) {
                        stats.warn++;
                        checks.push({ name: 'evidence', entry_id: entry.record_id, status: 'warn', message: `Referenced file does not exist: ${ref.path}` });
                    }
                }
            }
        }

        stats.pass++;
    }

    return { passed: stats.fail === 0, can_promote: stats.fail === 0, checks, stats };
}
