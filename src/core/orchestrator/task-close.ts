import { addOperation } from '../operations/add-memory.js';
import { doctorOperation } from '../operations/doctor.js';
import { promoteOperation } from '../operations/promote.js';
import type { TaskCloseOptions, TaskCloseResult, MemoryEntry } from '../models/index.js';
import type { SessionStore } from '../store/sessions.js';
import type { StagingStore } from '../store/staging.js';
import type { CanonicalStore } from '../store/canonical.js';
import type { FileSystemManager } from '../store/fs.js';

export async function taskCloseOperation(
    o: TaskCloseOptions, ss: SessionStore, st: StagingStore, ca: CanonicalStore, fsm: FileSystemManager,
    configDefaultMode: 'assisted' | 'manual' | 'direct' = 'direct'
): Promise<TaskCloseResult> {
    const session = await ss.getActive();
    if (!session) throw new Error('No active session');

    const promoteMode = o.promote_mode || configDefaultMode;

    // Create the task-summary entry in staging
    const entry = await addOperation({
        memory_type: o.memory_type || 'task-note',
        title: session.title,
        summary: o.summary,
        what_changed: o.what_changed || 'N/A',
        why_it_matters: o.why_it_matters || 'N/A',
    }, st);

    // Run doctor on specifically this entry
    const doctor = await doctorOperation({ entry_ids: [entry.record_id] }, st, fsm);

    let promoted: MemoryEntry[] = [];
    if (doctor.can_promote) {
        // Promote ALL entries in staging, not just the summary entry
        const res = await promoteOperation({}, st, ca, fsm, promoteMode, doctor);
        promoted = res.promoted;
    }

    // ALWAYS close session if we reached here (even if promotion failed)
    // to prevent deadlock on next taskStart
    session.status = 'closed';
    await ss.save(session);

    return { session, promoted_entries: promoted, skipped_entries: [], doctor };
}
