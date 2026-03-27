import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolveRepoRoot } from '../../src/core/config/agent-ready.js';

describe('Repo root resolution', () => {
    const testRoot = path.resolve('.test-repo-root-resolution');

    beforeEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
        fs.mkdirSync(path.join(testRoot, 'dist', 'core', 'config'), { recursive: true });
        fs.mkdirSync(path.join(testRoot, 'vendor', 'superpowers-curated'), { recursive: true });
        fs.writeFileSync(
            path.join(testRoot, 'package.json'),
            JSON.stringify({ name: '@thaild12042003/atlas-forge', version: '0.0.0' }, null, 2),
            'utf-8'
        );
    });

    afterEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
    });

    it('finds the repo root from a dist-like module path', () => {
        const start = path.join(testRoot, 'dist', 'core', 'config');
        expect(resolveRepoRoot(start)).toBe(testRoot);
    });
});
