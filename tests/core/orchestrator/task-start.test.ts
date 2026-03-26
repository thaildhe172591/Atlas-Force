import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { FileSystemManager } from '../../../src/core/store/fs.js';
import { CanonicalStore } from '../../../src/core/store/canonical.js';
import { SessionStore } from '../../../src/core/store/sessions.js';
import { taskStartOperation } from '../../../src/core/orchestrator/task-start.js';

describe('Orchestrator: Task Start', () => {
    const testRoot = path.join(process.cwd(), '.test-orch-task-start-clean');
    let fsm: FileSystemManager;
    let canonical: CanonicalStore;
    let sessionStore: SessionStore;

    beforeEach(async () => {
        await fs.rm(testRoot, { recursive: true, force: true });
        fsm = new FileSystemManager(testRoot);
        await fsm.ensureStructure();
        canonical = new CanonicalStore(fsm);
        sessionStore = new SessionStore(fsm);
    });

    afterEach(async () => {
        await fs.rm(testRoot, { recursive: true, force: true });
    });

    it('enforces active session guard', async () => {
        await taskStartOperation({ summary: 'First' }, sessionStore, canonical, fsm);
        await expect(taskStartOperation({ summary: 'Second' }, sessionStore, canonical, fsm))
            .rejects.toThrow(/Task already active/);
    });

    it('loads preflight maps if they exist', async () => {
        const indexDir = path.join(testRoot, '.atlasforge', 'indexes');
        await fs.mkdir(indexDir, { recursive: true });
        await fs.writeFile(path.join(indexDir, 'onboarding.md'), 'Welcome to Atlas', 'utf-8');

        const res = await taskStartOperation({ summary: 'Test Preflight' }, sessionStore, canonical, fsm);
        expect(res.preflight.onboarding).toBe('Welcome to Atlas');
    });
});
