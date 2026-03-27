import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { FileSystemManager } from '../../../src/core/store/fs.js';
import { CanonicalStore } from '../../../src/core/store/canonical.js';
import { StagingStore } from '../../../src/core/store/staging.js';
import { SessionStore } from '../../../src/core/store/sessions.js';
import { taskStartOperation } from '../../../src/core/orchestrator/task-start.js';
import { taskCloseOperation } from '../../../src/core/orchestrator/task-close.js';

describe('Orchestrator: Task Close', () => {
    const testRoot = path.join(process.cwd(), '.test-orch-task-close');
    let fsm: FileSystemManager;
    let canonical: CanonicalStore;
    let staging: StagingStore;
    let sessionStore: SessionStore;

    beforeEach(async () => {
        await fs.rm(testRoot, { recursive: true, force: true });
        fsm = new FileSystemManager(testRoot);
        await fsm.ensureStructure();
        canonical = new CanonicalStore(fsm);
        staging = new StagingStore(fsm);
        sessionStore = new SessionStore(fsm);
    });

    afterEach(async () => {
        await fs.rm(testRoot, { recursive: true, force: true });
    });

    it('does not auto-promote task-note summary entries on close', async () => {
        await taskStartOperation({ summary: 'Active' }, sessionStore, canonical, fsm);
        const res = await taskCloseOperation({ summary: 'Done', what_changed: 'All', why_it_matters: 'Business' }, sessionStore, staging, canonical, fsm, 'direct');

        expect(res.promoted_entries).toHaveLength(0);
        expect(res.skipped_entries).toHaveLength(1);
        expect(res.session.status).toBe('closed');

        const inCanonical = await canonical.all();
        expect(inCanonical).toHaveLength(0);
    });
});
