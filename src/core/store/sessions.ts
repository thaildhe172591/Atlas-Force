import type { FileSystemManager } from './fs.js';
import type { TaskSession } from '../models/index.js';

export class SessionStore {
    constructor(private fsm: FileSystemManager) { }

    async save(session: TaskSession): Promise<void> {
        const filePath = `sessions/${session.session_id}.json`;
        this.fsm.writeText(filePath, JSON.stringify(session, null, 2));
    }

    async getActive(): Promise<TaskSession | undefined> {
        try {
            const files = this.fsm.listDir('sessions');
            for (const file of files) {
                const subpath = `sessions/${file}`;
                const content = this.fsm.readText(subpath);
                const session = JSON.parse(content) as TaskSession;
                if (session.status === 'active') return session;
            }
        } catch { /* no active sessions */ }
        return undefined;
    }
}
