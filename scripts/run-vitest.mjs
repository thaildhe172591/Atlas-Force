import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
 
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
 
globalThis.console.log(`[Atlas Forge] Setting TMPDIR to: ${resolvedTemp}`);
 
const result = spawnSync(process.execPath, [vitestBin, ...args], {
    stdio: 'inherit',
    env: {
        ...process.env,
        TMPDIR: resolvedTemp,
        TMP: resolvedTemp,
        TEMP: resolvedTemp,
    },
    shell: false,
});
 
process.exit(result.status ?? 1);
