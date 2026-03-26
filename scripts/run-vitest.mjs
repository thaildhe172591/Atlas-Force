import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const candidates =
    process.platform === 'win32'
        ? [process.env.TEMP, process.env.TMP, process.env.TMPDIR, process.cwd()]
        : ['/tmp', process.env.TMPDIR, process.env.TMP, process.env.TEMP, process.cwd()];

const normalizedCandidates = candidates.filter((value) => typeof value === 'string' && value.length > 0);

const resolvedTemp = normalizedCandidates.find((candidate) => fs.existsSync(candidate)) || process.cwd();
const vitestPackageJson = require.resolve('vitest/package.json');
const vitestBin = path.join(path.dirname(vitestPackageJson), 'vitest.mjs');
const args = process.argv.slice(2);

process.env.TMPDIR = resolvedTemp;
process.env.TMP = resolvedTemp;
process.env.TEMP = resolvedTemp;
process.argv = [process.argv[0], vitestBin, ...args];
await import(pathToFileURL(vitestBin).href);
