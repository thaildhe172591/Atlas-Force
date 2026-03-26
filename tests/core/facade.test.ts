import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AtlasForge } from '../../src/core/facade.js';

describe('Facade: AtlasForge Smoke Test', () => {
    const testRoot = path.resolve('.test-facade-smoke');

    beforeEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
    });

    afterEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
    });

    it('verifies full core vertical slice: init -> start -> add -> close -> status -> search', async () => {
        // 1. Pre-configure for direct promotion in test
        const afDir = path.join(testRoot, '.atlasforge');
        fs.mkdirSync(afDir, { recursive: true });
        fs.writeFileSync(path.join(afDir, 'config.yaml'), 'promote_mode: direct', 'utf-8');

        // 2. Initialize
        const forge = await AtlasForge.init(testRoot);
        expect(forge.config.promote_mode).toBe('direct');

        // 3. Start task
        const start = await forge.taskStart({ summary: 'Implement Engine Facade' });
        expect(start.session.status).toBe('active');

        // 4. Add manual entry
        await forge.add({
            memory_type: 'task-note',
            title: 'Session management',
            summary: 'Implemented SessionStore.',
            what_changed: 'src/core/store/sessions.ts',
            why_it_matters: 'Enables task persistence'
        });

        // 5. Close task (creates task entry and promotes it)
        const close = await forge.taskClose({ summary: 'Facade finished', promote_mode: 'direct' });
        expect(close.promoted_entries).toHaveLength(1);

        // 6. Verify status
        const status = await forge.status();
        expect(status.snapshot.canonical_count).toBe(1);
        expect(status.snapshot.staging_count).toBe(1); // manual entry remains in staging

        // 7. Search (searches canonical)
        const search = await forge.search({ query: 'Facade' });
        expect(search).toHaveLength(1);
        expect(search[0].entry.title).toBe('Implement Engine Facade');
    });
});
