import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs/promises';
import { FileSystemManager } from '../../../src/core/store/fs.js';
import { StagingStore } from '../../../src/core/store/staging.js';
import { CanonicalStore } from '../../../src/core/store/canonical.js';
import type { MemoryEntry } from '../../../src/core/models/entry.js';

const TEST_ROOT = './tmp/test-store';

const sampleEntry: MemoryEntry = {
    record_id: 'rec_1',
    memory_id: 'mem_1',
    version: 1,
    memory_type: 'decision',
    title: 'Test Title',
    summary: 'Test Summary',
    what_changed: 'Changed X',
    why_it_matters: 'Matters because Y',
    modules: ['core'],
    tags: ['test'],
    files: [],
    evidence_refs: [],
    quality_state: 'draft',
    lifecycle_state: 'staging',
    source: 'manual',
    confidence: 'high',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {}
};

describe('Store Layer', () => {
    let fsm: FileSystemManager;
    let staging: StagingStore;
    let canonical: CanonicalStore;

    beforeEach(async () => {
        await fs.rm(TEST_ROOT, { recursive: true, force: true });
        fsm = new FileSystemManager(TEST_ROOT);
        await fsm.ensureStructure();
        staging = new StagingStore(fsm);
        canonical = new CanonicalStore(fsm);
    });

    describe('StagingStore', () => {
        it('should append and getAll', async () => {
            await staging.append(sampleEntry);
            const all = await staging.getAll();
            expect(all).toHaveLength(1);
            expect(all[0].record_id).toBe('rec_1');
        });

        it('should getById', async () => {
            await staging.append(sampleEntry);
            const entry = await staging.getById('rec_1');
            expect(entry).toBeDefined();
            expect(entry?.title).toBe('Test Title');
        });

        it('should update an entry', async () => {
            await staging.append(sampleEntry);
            const updated = { ...sampleEntry, title: 'Updated Title' };
            await staging.update(updated);
            const entry = await staging.getById('rec_1');
            expect(entry?.title).toBe('Updated Title');
        });

        it('should remove an entry', async () => {
            await staging.append(sampleEntry);
            await staging.remove('rec_1');
            const all = await staging.getAll();
            expect(all).toHaveLength(0);
        });
    });

    describe('CanonicalStore', () => {
        it('should append and all', async () => {
            await canonical.append(sampleEntry);
            const all = await canonical.all();
            expect(all).toHaveLength(1);
        });

        it('should getByRecordId', async () => {
            await canonical.append(sampleEntry);
            const entry = await canonical.getByRecordId('rec_1');
            expect(entry).toBeDefined();
        });

        it('should getLatestByMemoryId', async () => {
            await canonical.append(sampleEntry);
            await canonical.append({ ...sampleEntry, record_id: 'rec_2', version: 2 });
            const latest = await canonical.getLatestByMemoryId('mem_1');
            expect(latest?.version).toBe(2);
        });
    });
});
