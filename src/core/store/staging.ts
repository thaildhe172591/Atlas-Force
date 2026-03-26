import type { FileSystemManager } from './fs.js';
import type { MemoryEntry } from '../models/index.js';

export class StagingStore {
    private readonly SUBPATH = 'staging/staging.jsonl';
    constructor(private fsm: FileSystemManager) { }

    async append(entry: MemoryEntry): Promise<void> {
        await this.fsm.appendJsonl(this.SUBPATH, entry);
    }

    async getAll(): Promise<MemoryEntry[]> {
        return this.fsm.readJsonl<MemoryEntry>(this.SUBPATH);
    }

    async getById(recordId: string): Promise<MemoryEntry | undefined> {
        const entries = await this.getAll();
        return entries.find(e => e.record_id === recordId);
    }

    async update(entry: MemoryEntry): Promise<void> {
        const entries = await this.getAll();
        const index = entries.findIndex(e => e.record_id === entry.record_id);
        if (index === -1) throw new Error(`Entry ${entry.record_id} not found in staging`);
        entries[index] = entry;
        await this.fsm.writeJsonl(this.SUBPATH, entries);
    }

    async remove(recordId: string): Promise<void> {
        const entries = await this.getAll();
        const filtered = entries.filter(e => e.record_id !== recordId);
        await this.fsm.writeJsonl(this.SUBPATH, filtered);
    }
}
