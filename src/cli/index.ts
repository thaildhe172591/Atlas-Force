import * as fs from 'node:fs';
import * as path from 'node:path';
import { Command } from 'commander';
import chalk from 'chalk';
import { ZodError } from 'zod';
import { AtlasForge } from '../core/facade.js';
import { ADAPTIVE_AGENTS, isAgentSelection } from '../core/config/agent-ready.js';
import { MEMORY_TYPES } from '../core/models/states.js';
import type { AgentSelection } from '../core/models/index.js';

const CLI_VERSION = '0.4.2';

class CliValidationError extends Error {}

function formatError(err: unknown) {
    if (err instanceof CliValidationError) {
        return { code: 2, kind: 'validation', message: err.message };
    }

    if (err instanceof ZodError) {
        const message = err.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; ');
        return { code: 2, kind: 'validation', message };
    }

    const message = err instanceof Error ? err.message : String(err);
    return { code: 1, kind: 'runtime', message };
}

function outputJson(payload: unknown) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function handleCommandError(err: unknown, json = false) {
    const parsed = formatError(err);
    if (json) {
        outputJson({
            ok: false,
            error: {
                type: parsed.kind,
                message: parsed.message,
                exit_code: parsed.code,
            },
        });
    } else {
        console.error(chalk.red(`Error: ${parsed.message}`));
    }
    process.exitCode = parsed.code;
}

function ensureInitialized(root: string) {
    const atlasDir = path.join(root, '.atlasforge');
    if (!fs.existsSync(atlasDir)) {
        throw new CliValidationError('Atlas Forge is not initialized in this workspace. Run `atlas-forge init` first.');
    }
}

function validateLimit(value: string) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new CliValidationError('`--limit` must be a positive integer.');
    }
    return parsed;
}

function validateMemoryType(value: string) {
    if (!MEMORY_TYPES.includes(value as (typeof MEMORY_TYPES)[number])) {
        throw new CliValidationError(`Invalid memory type "${value}". Supported types: ${MEMORY_TYPES.join(', ')}`);
    }
    return value as (typeof MEMORY_TYPES)[number];
}

function validateAgent(value: string): AgentSelection {
    if (!isAgentSelection(value)) {
        throw new CliValidationError(`Invalid agent "${value}". Supported values: auto, ${ADAPTIVE_AGENTS.join(', ')}`);
    }
    return value;
}

export function createProgram() {
    const program = new Command();

    program
        .name('atlas-forge')
        .description('Atlas Forge CLI - The Persistent Knowledge Orchestration Engine')
        .version(CLI_VERSION)
        .option('-c, --cwd <path>', 'Working directory', process.cwd());

    program
        .command('init')
        .description('Initialize Atlas Forge in the current directory')
        .option('-a, --agent <agent>', 'Agent profile (auto, claude, gemini, codex)', 'auto')
        .option('-j, --json', 'Output machine-readable JSON')
        .action(async (options: { agent: string; json?: boolean }) => {
            const json = Boolean(options.json);
            const root = path.resolve(program.opts().cwd);
            try {
                const existed = fs.existsSync(path.join(root, '.atlasforge'));
                const agent = validateAgent(options.agent);
                const { bootstrap, agent_profile } = await AtlasForge.initWithReport(root, agent);
                const payload = {
                    ok: true,
                    command: 'init',
                    root,
                    atlasforge_path: path.join(root, '.atlasforge'),
                    existed_before: existed,
                    initialized: true,
                    agent_profile,
                    bootstrap,
                };
                if (json) {
                    outputJson(payload);
                } else {
                    console.log(chalk.blue('Forging Atlas...'));
                    console.log(chalk.green('OK Atlas Forge initialized in .atlasforge/'));
                    console.log(chalk.gray(`Agent profile: requested=${agent_profile.requested_agent}, detected=${agent_profile.detected_agent}, applied=${agent_profile.applied_agent}`));
                    console.log(chalk.gray(`Agent-ready artifacts: created=${bootstrap.created.length}, skipped=${bootstrap.skipped.length}`));
                }
            } catch (err) {
                handleCommandError(err, json);
            }
        });

    program
        .command('optimize')
        .description('Re-sync adaptive agent artifacts for current workspace')
        .option('-a, --agent <agent>', 'Agent profile (auto, claude, gemini, codex)', 'auto')
        .option('--dry-run', 'Preview changes without writing files')
        .option('-j, --json', 'Output machine-readable JSON')
        .action(async (options: { agent: string; dryRun?: boolean; json?: boolean }) => {
            const json = Boolean(options.json);
            const root = path.resolve(program.opts().cwd);
            const dryRun = Boolean(options.dryRun);
            try {
                const agent = validateAgent(options.agent);
                const { bootstrap, agent_profile } = await AtlasForge.optimizeWithReport(root, agent, dryRun);
                const payload = {
                    ok: true,
                    command: 'optimize',
                    root,
                    dry_run: dryRun,
                    agent_profile,
                    bootstrap,
                };
                if (json) {
                    outputJson(payload);
                } else {
                    const mode = dryRun ? chalk.yellow('DRY-RUN') : chalk.green('APPLIED');
                    console.log(chalk.bold(`Adaptive optimize: ${mode}`));
                    console.log(chalk.gray(`Agent profile: requested=${agent_profile.requested_agent}, detected=${agent_profile.detected_agent}, applied=${agent_profile.applied_agent}`));
                    console.log(chalk.gray(`Artifacts: created=${bootstrap.created.length}, skipped=${bootstrap.skipped.length}`));
                }
            } catch (err) {
                handleCommandError(err, json);
            }
        });

    program
        .command('start')
        .description('Start a new task session')
        .argument('<summary>', 'Short summary of the task')
        .option('-m, --modules <modules...>', 'Module hints (e.g. core, cli)')
        .option('-j, --json', 'Output machine-readable JSON')
        .action(async (summary: string, options: { modules?: string[]; json?: boolean }) => {
            const json = Boolean(options.json);
            const root = path.resolve(program.opts().cwd);
            try {
                ensureInitialized(root);
                const forge = await AtlasForge.load(root);
                const res = await forge.taskStart({
                    summary,
                    modules_hint: options.modules,
                });

                const payload = {
                    ok: true,
                    command: 'start',
                    session: res.session,
                    preflight: {
                        onboarding_loaded: Boolean(res.preflight.onboarding),
                        architecture_loaded: Boolean(res.preflight.architecture_map),
                        module_map_loaded: Boolean(res.preflight.module_map),
                        related_memories_count: res.preflight.related_memories?.length ?? 0,
                    },
                };

                if (json) {
                    outputJson(payload);
                } else {
                    console.log(chalk.blue(`Starting session: "${summary}"...`));
                    console.log(chalk.green(`OK Session active (ID: ${res.session.session_id.slice(0, 8)})`));
                }
            } catch (err) {
                handleCommandError(err, json);
            }
        });

    program
        .command('add')
        .description('Capture a new memory entry')
        .requiredOption('-t, --title <title>', 'Descriptive title')
        .requiredOption('-s, --summary <summary>', 'Brief summary')
        .option('-y, --type <type>', `Memory type (${MEMORY_TYPES.join(', ')})`, 'task-note')
        .option('-w, --what-changed <what>', 'Long-form description of what changed', 'Manual entry')
        .option('-r, --why <why>', 'Rationale for this memory', 'Context preservation')
        .option('-j, --json', 'Output machine-readable JSON')
        .action(async (options: { title: string; summary: string; type: string; whatChanged: string; why: string; json?: boolean }) => {
            const json = Boolean(options.json);
            const root = path.resolve(program.opts().cwd);
            try {
                ensureInitialized(root);
                const type = validateMemoryType(options.type);
                const forge = await AtlasForge.load(root);
                const entry = await forge.add({
                    memory_type: type,
                    title: options.title,
                    summary: options.summary,
                    what_changed: options.whatChanged,
                    why_it_matters: options.why,
                });

                const payload = {
                    ok: true,
                    command: 'add',
                    entry: {
                        record_id: entry.record_id,
                        memory_id: entry.memory_id,
                        memory_type: entry.memory_type,
                        title: entry.title,
                    },
                    staging_state: entry.lifecycle_state,
                };

                if (json) {
                    outputJson(payload);
                } else {
                    console.log(chalk.green('OK Memory captured to staging.'));
                }
            } catch (err) {
                handleCommandError(err, json);
            }
        });

    program
        .command('close')
        .description('Close active session and promote memories')
        .argument('<summary>', 'Summary of what was achieved')
        .option('-j, --json', 'Output machine-readable JSON')
        .action(async (summary: string, options: { json?: boolean }) => {
            const json = Boolean(options.json);
            const root = path.resolve(program.opts().cwd);
            try {
                ensureInitialized(root);
                const forge = await AtlasForge.load(root);
                const res = await forge.taskClose({ summary });

                const payload = {
                    ok: true,
                    command: 'close',
                    session: res.session,
                    promoted_count: res.promoted_entries.length,
                    skipped_count: res.skipped_entries.length,
                    doctor: res.doctor,
                };

                if (json) {
                    outputJson(payload);
                } else if (res.doctor.passed) {
                    console.log(chalk.green(`OK Task closed. ${res.promoted_entries.length} memories promoted.`));
                } else {
                    console.warn(chalk.yellow('Diagnostics failed for one or more entries.'));
                    console.log(res.doctor.checks.filter((c) => c.status === 'fail').map((c) => `- ${c.message}`).join('\n'));
                }
            } catch (err) {
                handleCommandError(err, json);
            }
        });

    program
        .command('status')
        .description('Show current status and health')
        .option('-a, --agent <agent>', 'Agent profile (auto, claude, gemini, codex)', 'auto')
        .option('-j, --json', 'Output machine-readable JSON')
        .action(async (options: { agent: string; json?: boolean }) => {
            const json = Boolean(options.json);
            const root = path.resolve(program.opts().cwd);
            try {
                ensureInitialized(root);
                const agent = validateAgent(options.agent);
                const forge = await AtlasForge.load(root, agent);
                const status = await forge.status(agent);
                const active = await forge.getActiveSession();
                const payload = {
                    ok: true,
                    command: 'status',
                    snapshot: status.snapshot,
                    promotion: status.promotion,
                    agent_profile: status.agent_profile,
                    agent_readiness_score: status.agent_readiness_score,
                    level: status.level,
                    gaps: status.gaps,
                    active_session: active,
                };

                if (json) {
                    outputJson(payload);
                } else {
                    console.log(chalk.bold('\n--- Atlas Forge Status ---'));
                    if (active) {
                        console.log(`Active Session: ${chalk.green(active.title)} (${active.session_id.slice(0, 8)})`);
                    } else {
                        console.log(`Active Session: ${chalk.gray('None')}`);
                    }
                    console.log(`Knowledge Base: ${chalk.cyan(status.snapshot.canonical_count)} memories`);
                    console.log(`Staging Area : ${chalk.yellow(status.snapshot.staging_count)} memories`);
                    const migrationFlag = status.promotion.migration_applied ? chalk.yellow(' (auto-migrated from assisted)') : '';
                    console.log(`Promote Mode : ${chalk.green(status.promotion.effective_mode)}${migrationFlag}`);
                    console.log(`Agent Ready : ${chalk.cyan(status.agent_readiness_score)}/10 (${status.level})`);
                    console.log(`Agent Profile: requested=${status.agent_profile.requested_agent}, detected=${status.agent_profile.detected_agent}, applied=${status.agent_profile.applied_agent}`);
                    console.log('---------------------------\n');
                }
            } catch (err) {
                handleCommandError(err, json);
            }
        });

    program
        .command('search')
        .description('Search the knowledge base')
        .argument('<query>', 'Query string')
        .option('-l, --limit <limit>', 'Max results', '5')
        .option('-j, --json', 'Output machine-readable JSON')
        .action(async (query: string, options: { limit: string; json?: boolean }) => {
            const json = Boolean(options.json);
            const root = path.resolve(program.opts().cwd);
            try {
                ensureInitialized(root);
                const limit = validateLimit(options.limit);
                const forge = await AtlasForge.load(root);
                const results = await forge.search({ query, limit });

                const payload = {
                    ok: true,
                    command: 'search',
                    query,
                    limit,
                    count: results.length,
                    results,
                };

                if (json) {
                    outputJson(payload);
                } else if (results.length === 0) {
                    console.log(chalk.gray('No matches found.'));
                } else {
                    console.log(chalk.bold(`\nFound ${results.length} matches:`));
                    for (const res of results) {
                        console.log(`${chalk.green(`[Score: ${res.score}]`)} ${chalk.bold(res.entry.title)}`);
                        console.log(`${chalk.gray(res.entry.summary)}`);
                        console.log(`${chalk.dim(`Reasons: ${res.match_reasons.join(', ')}`)}\n`);
                    }
                }
            } catch (err) {
                handleCommandError(err, json);
            }
        });
    program
        .command('doctor')
        .description('Run diagnostics against staged memories')
        .option('-j, --json', 'Output machine-readable JSON')
        .action(async (options: { json?: boolean }) => {
            const json = Boolean(options.json);
            const root = path.resolve(program.opts().cwd);
            try {
                ensureInitialized(root);
                const forge = await AtlasForge.load(root);
                const result = await forge.doctor({});

                const payload = {
                    ok: true,
                    command: 'doctor',
                    doctor: result,
                };

                if (json) {
                    outputJson(payload);
                } else if (result.passed) {
                    console.log(chalk.green(`OK Doctor passed. warn=${result.stats.warn}, fail=${result.stats.fail}`));
                } else {
                    console.log(chalk.yellow(`Doctor reported issues. warn=${result.stats.warn}, fail=${result.stats.fail}`));
                }
            } catch (err) {
                handleCommandError(err, json);
            }
        });

    program
        .command('verify')
        .description('Verify workspace readiness for Atlas Forge and MCP integration')
        .option('-a, --agent <agent>', 'Agent profile (auto, claude, gemini, codex)', 'auto')
        .option('-j, --json', 'Output machine-readable JSON')
        .action(async (options: { agent: string; json?: boolean }) => {
            const json = Boolean(options.json);
            const root = path.resolve(program.opts().cwd);
            try {
                const agent = validateAgent(options.agent);
                const result = await AtlasForge.verify(root, agent);
                const payload = {
                    ok: result.ok,
                    command: 'verify',
                    root: result.root,
                    checks: result.checks,
                    promotion: result.promotion,
                    agent_profile: result.agent_profile,
                    agent_readiness_score: result.agent_readiness_score,
                    level: result.level,
                    gaps: result.gaps,
                };

                if (json) {
                    outputJson(payload);
                } else {
                    const statusLabel = result.ok ? chalk.green('READY') : chalk.red('NOT READY');
                    console.log(chalk.bold(`Atlas Forge verify: ${statusLabel}`));
                    for (const check of result.checks) {
                        const icon = check.status === 'pass' ? chalk.green('PASS') : check.status === 'warn' ? chalk.yellow('WARN') : chalk.red('FAIL');
                        console.log(`[${icon}] ${check.name} - ${check.message}`);
                    }
                    const migrationFlag = result.promotion.migration_applied ? chalk.yellow(' (auto-migrated from assisted)') : '';
                    console.log(`Promotion mode: ${chalk.green(result.promotion.effective_mode)}${migrationFlag}`);
                    console.log(`Agent readiness: ${chalk.cyan(result.agent_readiness_score)}/10 (${result.level})`);
                    console.log(`Agent profile: requested=${result.agent_profile.requested_agent}, detected=${result.agent_profile.detected_agent}, applied=${result.agent_profile.applied_agent}`);
                }

                if (!result.ok) {
                    process.exitCode = 1;
                }
            } catch (err) {
                handleCommandError(err, json);
            }
        });

    return program;
}

export async function runCli(argv = process.argv) {
    const program = createProgram();
    await program.parseAsync(argv);
}
