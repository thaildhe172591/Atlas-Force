import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getAtlasForgeVersion, resolvePackageRoot } from '../../src/core/config/version.js';

describe('package version helper', () => {
    it('reads the version from package.json', () => {
        const root = resolvePackageRoot();
        const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as { version?: unknown };

        expect(getAtlasForgeVersion()).toBe(pkg.version);
    });
});
