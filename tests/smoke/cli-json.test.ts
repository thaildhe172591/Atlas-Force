import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { runCli } from '../../src/cli/index.js';

const ROOT = process.cwd();
const TEST_ROOT = path.resolve(ROOT, 'tmp/cli-smoke');

async function execCli(cwd: string, args: string[]) {
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
 
    try {
        await runCli(['node', 'atlas-forge', '--cwd', cwd, ...args]);
    } finally {
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

        const init = await execCli(TEST_ROOT, ['init', '--agent', 'codex', '--json']);
        expect(init.code).toBe(0);
        const initJson = JSON.parse(init.stdout);
        expect(initJson.ok).toBe(true);
        expect(initJson.agent_profile.applied_agent).toBe('codex');
        expect(Array.isArray(initJson.bootstrap.created)).toBe(true);
        expect(Array.isArray(initJson.bootstrap.skipped)).toBe(true);
        expect(Array.isArray(initJson.bootstrap.entrypoints)).toBe(true);
        expect(Array.isArray(initJson.bootstrap.bridges)).toBe(true);
        expect(Array.isArray(initJson.bootstrap.external_patch_files)).toBe(true);

        const optimizeDryRun = await execCli(TEST_ROOT, ['optimize', '--agent', 'codex', '--dry-run', '--json']);
        expect(optimizeDryRun.code).toBe(0);
        const optimizeDryRunJson = JSON.parse(optimizeDryRun.stdout);
        expect(optimizeDryRunJson.command).toBe('optimize');
        expect(optimizeDryRunJson.dry_run).toBe(true);

        const verify = await execCli(TEST_ROOT, ['verify', '--json']);
        expect(verify.code).toBe(0);
        const verifyJson = JSON.parse(verify.stdout);
        expect(verifyJson.ok).toBe(true);
        expect(verifyJson.agent_profile.applied_agent).toBe('codex');
        expect(typeof verifyJson.agent_readiness_score).toBe('number');
        expect(Array.isArray(verifyJson.entrypoints)).toBe(true);
        expect(Array.isArray(verifyJson.bridges)).toBe(true);
        expect(Array.isArray(verifyJson.external_patch_files)).toBe(true);

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
        expect(closeJson.promoted_count).toBeGreaterThan(0);

        const status = await execCli(TEST_ROOT, ['status', '--json']);
        expect(status.code).toBe(0);
        const statusJson = JSON.parse(status.stdout);
        expect(statusJson.snapshot.canonical_count).toBeGreaterThan(0);
        expect(statusJson.promotion.effective_mode).toBe('direct');
        expect(statusJson.agent_profile.applied_agent).toBe('codex');
        expect(typeof statusJson.agent_readiness_score).toBe('number');
        expect(Array.isArray(statusJson.gaps)).toBe(true);
        expect(Array.isArray(statusJson.entrypoints)).toBe(true);
        expect(Array.isArray(statusJson.bridges)).toBe(true);
        expect(Array.isArray(statusJson.external_patch_files)).toBe(true);

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

    it('supports init --agent all and generates all entry layer artifacts', async () => {
        const init = await execCli(TEST_ROOT, ['init', '--agent', 'all', '--json']);
        expect(init.code).toBe(0);
        const initJson = JSON.parse(init.stdout);
        expect(initJson.agent_profile.requested_agent).toBe('all');
        expect(initJson.bootstrap.entrypoints.some((artifact: any) => artifact.path === 'CLAUDE.md')).toBe(true);
        expect(initJson.bootstrap.entrypoints.some((artifact: any) => artifact.path === 'CODEX.md')).toBe(true);
        expect(initJson.bootstrap.entrypoints.some((artifact: any) => artifact.path === 'GEMINI.md')).toBe(true);
        expect(initJson.bootstrap.external_patch_files.some((artifact: any) => artifact.path.includes('/claude/'))).toBe(true);
        expect(initJson.bootstrap.external_patch_files.some((artifact: any) => artifact.path.includes('/codex/'))).toBe(true);
        expect(initJson.bootstrap.external_patch_files.some((artifact: any) => artifact.path.includes('/gemini/'))).toBe(true);
    });
});
