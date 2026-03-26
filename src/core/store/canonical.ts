import type { FileSystemManager } from './fs.js';
import type { MemoryEntry } from '../models/index.js';

export class CanonicalStore {
    private readonly SUBPATH = 'canonical/canonical.jsonl';
    constructor(private fsm: FileSystemManager) { }

    async append(entry: MemoryEntry): Promise<void> {
        await this.fsm.appendJsonl(this.SUBPATH, entry);
    }

    async all(): Promise<MemoryEntry[]> {
        return this.fsm.readJsonl<MemoryEntry>(this.SUBPATH);
    }

    async getByRecordId(id: string): Promise<MemoryEntry | undefined> {
        const entries = await this.all();
        return entries.find(e => e.record_id === id);
    }

    async getLatestByMemoryId(memId: string): Promise<MemoryEntry | undefined> {
        const entries = await this.all();
        return entries
            .filter(e => e.memory_id === memId)
            .sort((a, b) => b.version - a.version)[0];
    }
}
