import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AgentKind, AgentProfile, AgentReadiness, AgentSelection, InitBootstrapReport } from '../models/operations.js';
import type { PromotionModeHealth } from '../models/config.js';
import { DEFAULTS } from './defaults.js';

export const ADAPTIVE_AGENTS = ['claude', 'gemini', 'codex'] as const;

export function isAgentSelection(value: string): value is AgentSelection {
    return value === 'auto' || value === 'claude' || value === 'gemini' || value === 'codex';
}

const ROOT_GUIDANCE_TEMPLATES: Record<AgentKind, { path: string; content: string }> = {
    claude: {
        path: 'CLAUDE.md',
        content: `# CLAUDE.md - Atlas Forge MCP Workflow

Use Atlas Forge via MCP-first workflow for Claude.

## Required sequence
1. \`af_status\`
2. \`af_search\`
3. \`af_start_task\`
4. \`af_add_memory\` during milestones
5. \`af_close_task\`

## Rules
- Keep payloads structured and concise.
- Capture decisions and reusable patterns as memories.
- Always close the task with an explicit outcome summary.
`,
    },
    gemini: {
        path: 'GEMINI.md',
        content: `# GEMINI.md - Atlas Forge Agent Protocol

Use Atlas Forge as the memory system of record for this repository.

## Required workflow
1. \`atlas-forge status --json\`
2. \`atlas-forge search "<query>" --json\`
3. \`atlas-forge start "<task summary>" --json\`
4. \`atlas-forge add --type decision --title "<title>" --summary "<summary>" --json\`
5. \`atlas-forge doctor --json\`
6. \`atlas-forge close "<outcome summary>" --json\`
`,
    },
    codex: {
        path: 'AGENTS.md',
        content: `# AGENTS.md - Atlas Forge Codex Workflow

Codex should use Atlas Forge CLI in JSON mode.

## Task lifecycle
1. \`atlas-forge status --json\`
2. \`atlas-forge search "<query>" --json\`
3. \`atlas-forge start "<task summary>" --json\`
4. \`atlas-forge add --type code-pattern --title "<title>" --summary "<summary>" --json\`
5. \`atlas-forge doctor --json\`
6. \`atlas-forge close "<outcome summary>" --json\`
`,
    },
};

const SKILL_TEMPLATES: Record<string, string> = {
    'clean-code.md': `# clean-code

- Keep functions small and names explicit.
- Prefer straightforward control flow over cleverness.
- Remove dead code and unused imports/variables.
`,
    'brainstorming.md': `# brainstorming

- Clarify goals, constraints, and non-goals before coding.
- Compare 2-3 approaches and choose one with rationale.
- Define acceptance criteria before implementation.
`,
    'workflow.md': `# workflow

Standard task flow:
1. \`status\` + \`search\`
2. \`start\`
3. implement + \`add\`
4. \`doctor\`
5. \`close\`
`,
};

const WORKFLOW_TEMPLATES: Record<string, string> = {
    'task-lifecycle.md': `# task-lifecycle

Every task should follow:
1. status/search
2. start
3. add memories at key milestones
4. doctor
5. close
`,
};

const QUICKSTART_TEMPLATES: Record<AgentKind, string> = {
    claude: `# quickstart-claude

Use MCP tools:
\`af_status -> af_search -> af_start_task -> af_add_memory -> af_close_task\`.
`,
    gemini: `# quickstart-gemini

Use CLI JSON flow:
\`status -> search -> start -> add -> doctor -> close\`.
`,
    codex: `# quickstart-codex

Use CLI JSON flow and keep memories concise and actionable.
`,
};

type SignalMap = {
    claudeScore: number;
    geminiScore: number;
    codexScore: number;
    hasMcpSignal: boolean;
    hasAtlasDependency: boolean;
    signals: string[];
};

function safeRead(filePath: string): string | undefined {
    try {
        if (!fs.existsSync(filePath)) return undefined;
        return fs.readFileSync(filePath, 'utf-8');
    } catch {
        return undefined;
    }
}

function hasFile(root: string, relPath: string): boolean {
    return fs.existsSync(path.join(root, relPath));
}

function collectSignals(root: string): SignalMap {
    const signals: string[] = [];
    let claudeScore = 0;
    let geminiScore = 0;
    let codexScore = 0;

    if (hasFile(root, 'CLAUDE.md')) {
        claudeScore += 3;
        signals.push('root:CLAUDE.md');
    }
    if (hasFile(root, '.claude') || hasFile(root, '.claude.json') || hasFile(root, '.claude/settings.json')) {
        claudeScore += 2;
        signals.push('config:.claude*');
    }

    if (hasFile(root, 'GEMINI.md')) {
        geminiScore += 3;
        signals.push('root:GEMINI.md');
    }

    if (hasFile(root, 'AGENTS.md')) {
        codexScore += 3;
        signals.push('root:AGENTS.md');
    }
    if (hasFile(root, '.codex')) {
        codexScore += 2;
        signals.push('dir:.codex');
    }

    const mcpCandidates = [
        '.claude/settings.json',
        '.cursor/mcp.json',
        '.vscode/mcp.json',
        'mcp.json',
        'claude_desktop_config.json',
    ];
    let hasMcpSignal = false;
    for (const rel of mcpCandidates) {
        const content = safeRead(path.join(root, rel));
        if (!content) continue;
        if (content.includes('atlas-forge-mcp') || content.includes('af_init') || content.includes('atlas-forge')) {
            hasMcpSignal = true;
            claudeScore += 2;
            signals.push(`mcp:${rel}`);
            break;
        }
    }

    let hasAtlasDependency = false;
    const packageJson = safeRead(path.join(root, 'package.json'));
    if (packageJson) {
        try {
            const parsed = JSON.parse(packageJson) as Record<string, any>;
            const deps = {
                ...(parsed.dependencies || {}),
                ...(parsed.devDependencies || {}),
            };
            if (typeof deps['@thaild12042003/atlas-forge'] === 'string') {
                hasAtlasDependency = true;
                signals.push('pkg:@thaild12042003/atlas-forge');
            }
        } catch {
            // ignore malformed package.json during detection
        }
    }

    if (hasFile(root, 'node_modules/@thaild12042003/atlas-forge')) {
        hasAtlasDependency = true;
        signals.push('node_modules:atlas-forge');
    }

    return { claudeScore, geminiScore, codexScore, hasMcpSignal, hasAtlasDependency, signals };
}

function confidenceFromScores(top: number, second: number): 'low' | 'medium' | 'high' {
    if (top <= 0) return 'low';
    if (top >= 5 && top - second >= 2) return 'high';
    return 'medium';
}

function detectByScores(scores: SignalMap): { detected_agent: AgentKind; confidence: 'low' | 'medium' | 'high' } {
    const ranked: Array<{ agent: AgentKind; score: number }> = [
        { agent: 'claude', score: scores.claudeScore },
        { agent: 'gemini', score: scores.geminiScore },
        { agent: 'codex', score: scores.codexScore },
    ].sort((a, b) => b.score - a.score);

    if (ranked[0].score <= 0) {
        return { detected_agent: 'codex', confidence: 'low' };
    }

    return {
        detected_agent: ranked[0].agent,
        confidence: confidenceFromScores(ranked[0].score, ranked[1]?.score ?? 0),
    };
}

export function detectAgentProfile(root: string, requestedAgent: AgentSelection = 'auto'): AgentProfile {
    const scoreMap = collectSignals(root);
    const detected = detectByScores(scoreMap);
    const applied_agent = requestedAgent === 'auto' ? detected.detected_agent : requestedAgent;
    const confidence = requestedAgent === 'auto' ? detected.confidence : 'high';

    const signals = [...scoreMap.signals];
    if (requestedAgent !== 'auto') {
        signals.push(`requested:${requestedAgent}`);
    }
    if (scoreMap.signals.length === 0) {
        signals.push('fallback:codex-low-confidence');
    }

    return {
        requested_agent: requestedAgent,
        detected_agent: detected.detected_agent,
        applied_agent,
        confidence,
        signals,
    };
}

type BootstrapOptions = {
    requestedAgent?: AgentSelection;
    dryRun?: boolean;
};

function trackDirectory(dirPath: string, reportPath: string, report: InitBootstrapReport, dryRun: boolean): void {
    if (fs.existsSync(dirPath)) {
        report.skipped.push(reportPath);
        return;
    }
    if (!dryRun) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    report.created.push(reportPath);
}

function writeIfMissing(absolutePath: string, content: string, report: InitBootstrapReport, reportPath: string, dryRun: boolean): void {
    if (fs.existsSync(absolutePath)) {
        report.skipped.push(reportPath);
        return;
    }
    if (!dryRun) {
        fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
        fs.writeFileSync(absolutePath, content, 'utf-8');
    }
    report.created.push(reportPath);
}

function requiredArtifactPaths(appliedAgent: AgentKind): string[] {
    const rootGuidance = ROOT_GUIDANCE_TEMPLATES[appliedAgent].path;
    const quickstart = `.atlasforge/workflows/quickstart-${appliedAgent}.md`;
    return [
        rootGuidance,
        '.atlasforge/skills/clean-code.md',
        '.atlasforge/skills/brainstorming.md',
        '.atlasforge/skills/workflow.md',
        '.atlasforge/workflows/task-lifecycle.md',
        quickstart,
    ];
}

export function bootstrapAdaptiveArtifacts(
    root: string,
    options: BootstrapOptions = {}
): { agent_profile: AgentProfile; bootstrap: InitBootstrapReport } {
    const requestedAgent = options.requestedAgent ?? 'auto';
    const dryRun = Boolean(options.dryRun);
    const agentProfile = detectAgentProfile(root, requestedAgent);
    const report: InitBootstrapReport = { created: [], skipped: [], dry_run: dryRun };

    const rootGuidance = ROOT_GUIDANCE_TEMPLATES[agentProfile.applied_agent];
    writeIfMissing(path.join(root, rootGuidance.path), rootGuidance.content, report, rootGuidance.path, dryRun);

    const skillsDir = path.join(root, '.atlasforge', 'skills');
    trackDirectory(skillsDir, '.atlasforge/skills/', report, dryRun);
    for (const [name, content] of Object.entries(SKILL_TEMPLATES)) {
        writeIfMissing(path.join(skillsDir, name), content, report, `.atlasforge/skills/${name}`, dryRun);
    }

    const workflowsDir = path.join(root, '.atlasforge', 'workflows');
    trackDirectory(workflowsDir, '.atlasforge/workflows/', report, dryRun);
    for (const [name, content] of Object.entries(WORKFLOW_TEMPLATES)) {
        writeIfMissing(path.join(workflowsDir, name), content, report, `.atlasforge/workflows/${name}`, dryRun);
    }

    const quickstartName = `quickstart-${agentProfile.applied_agent}.md`;
    writeIfMissing(
        path.join(workflowsDir, quickstartName),
        QUICKSTART_TEMPLATES[agentProfile.applied_agent],
        report,
        `.atlasforge/workflows/${quickstartName}`,
        dryRun
    );

    return { agent_profile: agentProfile, bootstrap: report };
}

export function evaluateAgentReadiness(
    root: string,
    requestedAgent: AgentSelection = 'auto',
    verifyPassed = true,
    promotionHealth: PromotionModeHealth = {
        configured_mode: DEFAULTS.promote_mode,
        effective_mode: DEFAULTS.promote_mode,
        migration_applied: false,
    }
): AgentReadiness {
    const profile = detectAgentProfile(root, requestedAgent);
    const gaps: string[] = [];

    let score = 0;
    score += 2; // detection valid

    const required = requiredArtifactPaths(profile.applied_agent);
    const present = required.filter((rel) => hasFile(root, rel)).length;
    const artifactScore = Number(((present / required.length) * 4).toFixed(1));
    score += artifactScore;
    for (const rel of required) {
        if (!hasFile(root, rel)) {
            gaps.push(`missing artifact: ${rel}`);
        }
    }

    const signalMap = collectSignals(root);
    if (profile.applied_agent === 'claude') {
        if (signalMap.hasMcpSignal) {
            score += 2;
        } else {
            gaps.push('missing MCP integration signal for Claude (no atlas-forge MCP config detected)');
        }
    } else if (signalMap.hasAtlasDependency) {
        score += 2;
    } else {
        gaps.push('atlas-forge dependency not detected in package.json/node_modules for CLI-first workflow');
    }

    if (promotionHealth.effective_mode !== 'assisted') {
        score += 1;
    } else {
        gaps.push('promote_mode is assisted; direct/manual recommended for predictable close behavior');
    }

    if (verifyPassed) {
        score += 1;
    } else {
        gaps.push('workspace verification failed; fix verify checks before relying on agent automation');
    }

    const normalized = Math.max(0, Math.min(10, Number(score.toFixed(1))));
    const level: 'basic' | 'good' | 'excellent' = normalized >= 8.5 ? 'excellent' : normalized >= 6 ? 'good' : 'basic';

    return {
        agent_profile: profile,
        agent_readiness_score: normalized,
        level,
        gaps,
    };
}
