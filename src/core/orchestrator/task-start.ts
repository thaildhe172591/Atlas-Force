import * as crypto from 'node:crypto';
import type { TaskStartOptions, TaskStartResult, TaskSession } from '../models/index.js';
import type { SessionStore } from '../store/sessions.js';
import type { CanonicalStore } from '../store/canonical.js';
import type { FileSystemManager } from '../store/fs.js';

import { relatedOperation } from '../operations/retrieval.js';

export async function taskStartOperation(o: TaskStartOptions, ss: SessionStore, ca: CanonicalStore, fsm: FileSystemManager): Promise<TaskStartResult> {
    const active = await ss.getActive();
    if (active) throw new Error(`Task already active: ${active.title}`);

    const session: TaskSession = {
        session_id: crypto.randomUUID(),
        title: o.summary,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        related_memories_loaded: [],
        metadata: {}
    };

    let onboarding: string | undefined;
    let architecture_map: string | undefined;
    let module_map: string | undefined;

    if (!o.skip_preflight) {
        const read = (p: string) => {
            try { return fsm.readText(p); }
            catch { return undefined; }
        };

        onboarding = read('indexes/onboarding.md');
        architecture_map = read('indexes/architecture-map.md');
        module_map = read('indexes/module-map.md');
    }

    const related = await relatedOperation({ modules: o.modules_hint, limit: 5 }, ca);

    await ss.save(session);
    return {
        session,
        preflight: {
            onboarding,
            architecture_map,
            module_map,
            related_memories: related
        }
    };
}
