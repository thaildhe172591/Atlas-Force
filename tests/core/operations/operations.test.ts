import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'node:fs/promises';
import { FileSystemManager } from '../../../src/core/store/fs.js';
import { StagingStore } from '../../../src/core/store/staging.js';
import { CanonicalStore } from '../../../src/core/store/canonical.js';
import { addOperation } from '../../../src/core/operations/add-memory.js';
import { doctorOperation } from '../../../src/core/operations/doctor.js';
import { promoteOperation } from '../../../src/core/operations/promote.js';

const TEST_ROOT = './tmp/test-ops';

describe('Operations Layer', () => {
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

    it('addOperation should generate IDs and auto-enrich', async () => {
        const entry = await addOperation({
            memory_type: 'decision',
            title: 'Test',
            summary: 'Test',
            what_changed: 'X',
            why_it_matters: 'Y',
            files: ['src/core/store/fs.ts']
        }, staging);

        expect(entry.record_id).toBeDefined();
        expect(entry.modules).toContain('store'); // inferred from fs.ts
        expect(entry.tags).toContain('store');
        expect(entry.inferred_fields).toContain('modules');
    });

    it('doctorOperation should detect duplicates and missing evidence', async () => {
        await addOperation({
            memory_type: 'decision',
            title: 'Duo',
            summary: 'Duo',
            what_changed: 'X',
            why_it_matters: 'Y'
        }, staging);

        // Duplicate
        await addOperation({
            memory_type: 'decision',
            title: 'Duo',
            summary: 'Duo',
            what_changed: 'X',
            why_it_matters: 'Y'
        }, staging);

        const res = await doctorOperation({}, staging, fsm);
        expect(res.stats.warn).toBeGreaterThan(0);
        expect(res.checks.some(c => c.name === 'duplicate')).toBe(true);
        expect(res.checks.some(c => c.name === 'evidence')).toBe(true); // default add has no evidence
    });

    it('promoteOperation should move entries in direct mode', async () => {
        const entry = await addOperation({
            memory_type: 'decision',
            title: 'Promote Me',
            summary: 'Test',
            what_changed: 'X',
            why_it_matters: 'Y'
        }, staging);

        const res = await promoteOperation({ entry_ids: [entry.record_id] }, staging, canonical, fsm, 'direct');
        expect(res.promoted).toHaveLength(1);

        const staged = await staging.getAll();
        expect(staged).toHaveLength(0);

        const inCanonical = await canonical.all();
        expect(inCanonical).toHaveLength(1);
    });
});
