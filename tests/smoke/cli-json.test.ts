import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { runCli } from '../../src/cli/index.js';

const ROOT = process.cwd();
const TEST_ROOT = path.resolve(ROOT, 'tmp/cli-smoke');

async function execCli(cwd: string, args: string[]) {
    const originalCwd = process.cwd();
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    const originalStderrWrite = process.stderr.write.bind(process.stderr);
    let stdout = '';
    let stderr = '';

    process.stdout.write = ((chunk: any) => {
        stdout += String(chunk);
        return true;
    }) as typeof process.stdout.write;

    process.stderr.write = ((chunk: any) => {
        stderr += String(chunk);
        return true;
    }) as typeof process.stderr.write;

    process.exitCode = undefined;
    process.chdir(cwd);

    try {
        await runCli(['node', 'atlas-forge', ...args]);
    } finally {
        process.chdir(originalCwd);
        process.stdout.write = originalStdoutWrite;
        process.stderr.write = originalStderrWrite;
    }

    const code = process.exitCode ?? 0;
    process.exitCode = undefined;
    return { code, stdout, stderr };
}

describe('CLI JSON smoke', () => {
    beforeEach(async () => {
        await fs.rm(TEST_ROOT, { recursive: true, force: true });
        await fs.mkdir(TEST_ROOT, { recursive: true });
    });

    afterEach(async () => {
        await fs.rm(TEST_ROOT, { recursive: true, force: true });
    });

    it('runs end-to-end workflow in JSON mode', async () => {
        const verifyBeforeInit = await execCli(TEST_ROOT, ['verify', '--json']);
        expect(verifyBeforeInit.code).toBe(1);
        const verifyBeforeInitJson = JSON.parse(verifyBeforeInit.stdout);
        expect(verifyBeforeInitJson.command).toBe('verify');

        const init = await execCli(TEST_ROOT, ['init', '--json']);
        expect(init.code).toBe(0);
        const initJson = JSON.parse(init.stdout);
        expect(initJson.ok).toBe(true);

        const verify = await execCli(TEST_ROOT, ['verify', '--json']);
        expect(verify.code).toBe(0);
        const verifyJson = JSON.parse(verify.stdout);
        expect(verifyJson.ok).toBe(true);

        const start = await execCli(TEST_ROOT, ['start', 'Smoke task', '--json']);
        expect(start.code).toBe(0);
        const startJson = JSON.parse(start.stdout);
        expect(startJson.session.status).toBe('active');

        const add = await execCli(TEST_ROOT, [
            'add',
            '--type',
            'code-pattern',
            '--title',
            'CLI smoke memory',
            '--summary',
            'Capture memory from smoke test',
            '--json',
        ]);
        expect(add.code).toBe(0);
        const addJson = JSON.parse(add.stdout);
        expect(addJson.entry.memory_type).toBe('code-pattern');

        const doctor = await execCli(TEST_ROOT, ['doctor', '--json']);
        expect(doctor.code).toBe(0);
        const doctorJson = JSON.parse(doctor.stdout);
        expect(doctorJson.command).toBe('doctor');

        const close = await execCli(TEST_ROOT, ['close', 'Smoke task done', '--json']);
        expect(close.code).toBe(0);
        const closeJson = JSON.parse(close.stdout);
        expect(closeJson.command).toBe('close');
        expect(closeJson.promoted_count + closeJson.skipped_count).toBeGreaterThan(0);

        const status = await execCli(TEST_ROOT, ['status', '--json']);
        expect(status.code).toBe(0);
        const statusJson = JSON.parse(status.stdout);
        expect(statusJson.snapshot.staging_count + statusJson.snapshot.canonical_count).toBeGreaterThan(0);

        const search = await execCli(TEST_ROOT, ['search', 'Smoke', '--json']);
        expect(search.code).toBe(0);
        const searchJson = JSON.parse(search.stdout);
        expect(searchJson.command).toBe('search');
    });

    it('returns validation error and exit code 2 for invalid type', async () => {
        const init = await execCli(TEST_ROOT, ['init', '--json']);
        expect(init.code).toBe(0);

        const bad = await execCli(TEST_ROOT, [
            'add',
            '--type',
            'invalid-type',
            '--title',
            'Bad',
            '--summary',
            'Bad',
            '--json',
        ]);
        expect(bad.code).toBe(2);
        const payload = JSON.parse(bad.stdout);
        expect(payload.ok).toBe(false);
        expect(payload.error.type).toBe('validation');
    });
});
