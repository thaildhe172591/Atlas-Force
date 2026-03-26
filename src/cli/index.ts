import { Command } from 'commander';
import chalk from 'chalk';
import { AtlasForge } from '../core/facade.js';

const program = new Command();

program
    .name('atlas')
    .description('Atlas Forge CLI - The Persistent Knowledge Orchestration Engine')
    .version('0.2.2');

program
    .command('init')
    .description('Initialize Atlas Forge in the current directory')
    .action(async () => {
        try {
            console.log(chalk.blue('Forging Atlas...'));
            await AtlasForge.init(process.cwd());
            console.log(chalk.green('✔ Atlas Forge initialized in .atlasforge/'));
        } catch (err: any) {
            console.error(chalk.red(`Failed: ${err.message}`));
            process.exit(1);
        }
    });

program
    .command('start')
    .description('Start a new task session')
    .argument('<summary>', 'Short summary of the task')
    .option('-m, --modules <modules...>', 'Module hints (e.g. core, cli)')
    .action(async (summary, options) => {
        try {
            const forge = await AtlasForge.load(process.cwd());
            console.log(chalk.blue(`🚀 Starting session: "${summary}"...`));
            const res = await forge.taskStart({
                summary,
                modules_hint: options.modules,
            });
            console.log(chalk.green(`✔ Session active (ID: ${res.session.session_id.slice(0, 8)})`));
        } catch (err: any) {
            console.error(chalk.red(`Error: ${err.message}`));
            process.exit(1);
        }
    });

program
    .command('add')
    .description('Capture a new memory entry')
    .requiredOption('-t, --title <title>', 'Descriptive title')
    .requiredOption('-s, --summary <summary>', 'Brief summary')
    .option('-y, --type <type>', 'Memory type (e.g. decision, task-note)', 'task-note')
    .option('-w, --what-changed <what>', 'Long-form description of what changed', 'Manual entry')
    .option('-r, --why <why>', 'Rationale for this memory', 'Context preservation')
    .action(async (options) => {
        try {
            const forge = await AtlasForge.load(process.cwd());
            await forge.add({
                memory_type: options.type,
                title: options.title,
                summary: options.summary,
                what_changed: options.whatChanged, // Commander camel-cases flags
                why_it_matters: options.why
            });
            console.log(chalk.green('✔ Memory captured to staging.'));
        } catch (err: any) {
            console.error(chalk.red(`Error: ${err.message}`));
            process.exit(1);
        }
    });

program
    .command('close')
    .description('Close active session and promote memories')
    .argument('<summary>', 'Summary of what was achieved')
    .action(async (summary) => {
        try {
            const forge = await AtlasForge.load(process.cwd());
            console.log(chalk.blue('Closing session... Running diagnostics...'));
            const res = await forge.taskClose({ summary });

            if (res.doctor.passed) {
                console.log(chalk.green(`✔ Task closed successfully. ${res.promoted_entries.length} memories promoted.`));
            } else {
                console.warn(chalk.yellow('⚠ Diagnostics failed. Session remains active for manual fixes.'));
                console.log(res.doctor.checks.filter(c => c.status === 'fail').map(c => `- ${c.message}`).join('\n'));
            }
        } catch (err: any) {
            console.error(chalk.red(`Error: ${err.message}`));
            process.exit(1);
        }
    });

program
    .command('status')
    .description('Show current status and health')
    .action(async () => {
        try {
            const forge = await AtlasForge.load(process.cwd());
            const res = await forge.status();
            const active = await forge.getActiveSession();

            console.log(chalk.bold('\n--- Atlas Forge Status ---'));
            if (active) {
                console.log(`Active Session: ${chalk.green(active.title)} (${active.session_id.slice(0, 8)})`);
            } else {
                console.log('Active Session: ' + chalk.gray('None'));
            }
            console.log(`Knowledge Base: ${chalk.cyan(res.snapshot.canonical_count)} memories`);
            console.log(`Staging Area : ${chalk.yellow(res.snapshot.staging_count)} memories`);
            console.log('---------------------------\n');
        } catch (err: any) {
            console.error(chalk.red(`Error: ${err.message}`));
            process.exit(1);
        }
    });

program
    .command('search')
    .description('Search the knowledge base')
    .argument('<query>', 'Query string')
    .option('-l, --limit <limit>', 'Max results', '5')
    .action(async (query, options) => {
        try {
            const forge = await AtlasForge.load(process.cwd());
            console.log(chalk.blue(`Searching for: "${query}"...`));
            const results = await forge.search({ query, limit: parseInt(options.limit) });

            if (results.length === 0) {
                console.log(chalk.gray('No matches found.'));
            } else {
                console.log(chalk.bold(`\nFound ${results.length} matches:`));
                results.forEach(res => {
                    console.log(`${chalk.green(`[Score: ${res.score}]`)} ${chalk.bold(res.entry.title)}`);
                    console.log(`${chalk.gray(res.entry.summary)}`);
                    console.log(`${chalk.dim(`Reasons: ${res.match_reasons.join(', ')}`)}\n`);
                });
            }
        } catch (err: any) {
            console.error(chalk.red(`Error: ${err.message}`));
            process.exit(1);
        }
    });


program.parse();
