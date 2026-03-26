import { defineConfig } from 'vitest/config';
import * as fs from 'node:fs';
import * as os from 'node:os';

const tempCandidates = [process.env.TMPDIR, process.env.TMP, process.env.TEMP, os.tmpdir(), '/tmp']
    .filter((value): value is string => Boolean(value));

const resolvedTempDir = tempCandidates.find((candidate) => fs.existsSync(candidate)) || '/tmp';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        env: {
            TMPDIR: resolvedTempDir,
            TMP: resolvedTempDir,
            TEMP: resolvedTempDir,
        },
    },
});
