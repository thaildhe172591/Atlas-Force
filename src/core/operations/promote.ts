import { doctorOperation } from './doctor.js';
import type { PromoteOptions, PromoteResult, MemoryEntry, DoctorResult } from '../models/index.js';
import type { StagingStore } from '../store/staging.js';
import type { CanonicalStore } from '../store/canonical.js';
import type { FileSystemManager } from '../store/fs.js';

export async function promoteOperation(
    options: PromoteOptions,
    staging: StagingStore,
    canonical: CanonicalStore,
    fsm: FileSystemManager,
    mode: 'assisted' | 'manual' | 'direct' = 'direct',
    doctorResult?: DoctorResult
): Promise<PromoteResult> {
    const doctor = doctorResult || await doctorOperation(options, staging, fsm);
    if (!doctor.can_promote) throw new Error('Cannot promote: doctor failed.');

    const entries = await staging.getAll();
    const toPromote = options.entry_ids ? entries.filter(e => options.entry_ids!.includes(e.record_id)) : entries;

    const promoted: MemoryEntry[] = [];
    const skipped: MemoryEntry[] = [];
    const reason_map: Record<string, string> = {};

    for (const entry of toPromote) {
        if (mode === 'direct') {
            const p: MemoryEntry = { ...entry, quality_state: 'verified', lifecycle_state: 'canonical' };
            await canonical.append(p);
            await staging.remove(entry.record_id);
            promoted.push(p);
        } else if (mode === 'assisted') {
            skipped.push(entry);
            reason_map[entry.record_id] = 'Assisted mode: requires manual approval';
        } else {
            // manual
            const p: MemoryEntry = { ...entry, quality_state: 'verified' };
            await staging.update(p);
            skipped.push(p);
            reason_map[entry.record_id] = 'Manual mode: marked as verified in staging';
        }
    }

    return { mode, promoted, skipped, reason_map };
}
