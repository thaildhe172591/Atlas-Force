import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'yaml';
import type {
    AgentConfidence,
    AgentKind,
    AgentProfile,
    AgentReadiness,
    AgentSelection,
    EntryArtifactKind,
    EntryArtifactMetadata,
    InitBootstrapReport,
} from '../models/operations.js';
import type { AtlasForgeConfig, ProfileMode, PromotionModeHealth, RuntimePatchState } from '../models/config.js';
import { DEFAULTS } from './defaults.js';

export const ADAPTIVE_AGENTS = ['claude', 'gemini', 'codex'] as const;
const AGENT_SELECTIONS = ['auto', 'all', ...ADAPTIVE_AGENTS] as const;
const GENERATED_BY = 'atlas-forge' as const;
const MANAGED_VERSION = '0.4.6';
const CANONICAL_ID = 'atlas-forge';
const DISPLAY_NAME = 'Atlas Forge';
const INVOCATION_ALIASES = ['/atlas', '$Atlas Forge', 'atlas-forge'];
const VENDOR_PROVENANCE = 'vendor:obra/superpowers#curated-v1';
const VENDOR_ROOT_CANDIDATES = [
    'vendor/superpowers-curated',
    'vendor/superpowers',
];
const CURATED_VENDOR_SKILLS = [
    'brainstorming',
    'dispatching-parallel-agents',
    'executing-plans',
    'finishing-a-development-branch',
    'requesting-code-review',
    'systematic-debugging',
    'test-driven-development',
    'verification-before-completion',
    'writing-plans',
] as const;
const CURATED_VENDOR_COMMANDS = ['brainstorm.md', 'write-plan.md', 'execute-plan.md'] as const;
const CURATED_VENDOR_HOOKS = ['hooks.json', 'hooks-cursor.json', 'session-start', 'run-hook.cmd'] as const;
const RUNTIME_PATCH_PATHS: Record<AgentKind, string> = {
    claude: '.atlasforge/install/claude/claude-desktop-config.patch.json',
    codex: '.atlasforge/install/codex/atlas-forge-skill.md',
    gemini: '.atlasforge/install/gemini/gemini-commands.md',
};

type ArtifactCategory = 'entrypoints' | 'bridges' | 'external_patch_files';
type ManagementTier = 'atlas-managed' | 'vendor-managed' | 'user-owned';
type InstallMode = 'repo-local-only' | 'external-patch' | 'guidance-only' | 'manual-install' | 'unsupported';
type MergeStrategy = 'replace-if-unmodified' | 'drift-report';

type DesiredArtifact = {
    id: string;
    kind: EntryArtifactKind;
    displayName?: string;
    category: ArtifactCategory;
    path: string;
    agentTargets: AgentKind[];
    managementTier?: ManagementTier;
    atlasOwner?: 'atlas' | 'vendor';
    sourceProvenance?: string;
    upstreamPath?: string;
    installMode?: InstallMode;
    mergeStrategy?: MergeStrategy;
    conflictPolicy?: 'preserve-user';
    invocationAliases?: string[];
    body: string;
    legacyContents?: string[];
};

type ManagedHeader = {
    generated_by: string;
    artifact_id: string;
    managed: boolean;
    version: string;
    canonical_id: string;
    display_name: string;
    management_tier: ManagementTier;
    atlas_owner: 'atlas' | 'vendor';
    source_provenance: string;
    upstream_path?: string;
    install_mode: InstallMode;
    merge_strategy: MergeStrategy;
    conflict_policy: 'preserve-user';
    invocation_aliases: string[];
    content_sha256: string;
};

type ParsedManagedFile = {
    header: ManagedHeader | null;
    body: string;
};

type BootstrapOptions = {
    requestedAgent?: AgentSelection;
    dryRun?: boolean;
};

type WorkspacePolicy = {
    profile_mode: ProfileMode;
    runtime_patch_state: Record<AgentKind, RuntimePatchState>;
};

export function resolveRepoRoot(startDir = path.dirname(fileURLToPath(import.meta.url))): string {
    let current = path.resolve(startDir);
    while (true) {
        const pkgPath = path.join(current, 'package.json');
        const vendorPath = path.join(current, 'vendor', 'superpowers-curated');
        if (fs.existsSync(pkgPath) && fs.existsSync(vendorPath)) {
            return current;
        }
        const parent = path.dirname(current);
        if (parent === current) {
            break;
        }
        current = parent;
    }
    return path.resolve(startDir);
}

function normalizedArtifact(artifact: DesiredArtifact): Required<Omit<DesiredArtifact, 'legacyContents' | 'upstreamPath'>> & Pick<DesiredArtifact, 'legacyContents' | 'upstreamPath'> {
    return {
        ...artifact,
        displayName: artifact.displayName ?? artifact.id,
        managementTier: artifact.managementTier ?? 'atlas-managed',
        atlasOwner: artifact.atlasOwner ?? 'atlas',
        sourceProvenance: artifact.sourceProvenance ?? 'atlas-authored',
        installMode: artifact.installMode ?? (artifact.category === 'external_patch_files' ? 'external-patch' : 'repo-local-only'),
        mergeStrategy: artifact.mergeStrategy ?? 'replace-if-unmodified',
        conflictPolicy: artifact.conflictPolicy ?? 'preserve-user',
    };
}

function sharedSkillBody() {
    return `# ${DISPLAY_NAME}

Use ${DISPLAY_NAME} as the shared memory and workflow layer for this repository.

## Identity
- display name: \`${DISPLAY_NAME}\`
- canonical id: \`${CANONICAL_ID}\`
- invocation aliases: \`${INVOCATION_ALIASES.join('`, `')}\`

## Workflow policy
- States: \`uninitialized\`, \`ready\`, \`session-open\`, \`read-only-analysis\`, \`implementation\`, \`verification\`, \`closed\`, \`failed\`
- Required gates:
  - run \`status\` or \`verify\` before execution if initialization is uncertain
  - run \`doctor\` before \`close\` for any task that wrote memory
  - \`close\` is only valid when a task session is open
- Optional steps:
  - \`search\` is optional when context is already explicit
  - \`add\` is optional for read-only or advisory work
  - \`start\` is optional only for pure readiness checks

## Memory policy
- Write durable memory only for reusable patterns, non-obvious decisions, architecture/module knowledge, or bugfix lessons likely to recur.
- Do not write durable memory for transient scans, speculative ideas, duplicated code summaries, or raw logs.
- Search before writing. Compress or skip duplicates.
- Treat task-local notes as temporary until promoted by a valid \`close\`.

## Composition policy
- Bridge files are composition policies, not runtime plugins.
- Precedence:
  1. Atlas Forge shared skill policy
  2. Agent launch file
  3. One explicit bridge policy
  4. User task content
- If multiple bridges are requested, the first explicit bridge wins and the rest should be ignored.

## Reconciliation policy
- Managed files use file-level ownership in v1.
- Formatting-only changes are intentionally treated as drift for conservative safety.
`;
}

function sharedRootBody() {
    return `# AGENTS.md - ${DISPLAY_NAME} Launch Layer

Use \`.atlasforge/skills/atlas-forge.md\` as the single source of truth for Atlas Forge behavior.

## Shared entrypoints
- shared skill: \`.atlasforge/skills/atlas-forge.md\`
- command templates: \`.atlasforge/commands/\`
- bridge policies: \`.atlasforge/bridges/\`
- install patches: \`.atlasforge/install/\`

## Agent launch files
- Claude: \`CLAUDE.md\`
- Gemini: \`GEMINI.md\`
- Codex: \`CODEX.md\`

## Invocation aliases
- \`${INVOCATION_ALIASES.join('`\n- `')}\`
`;
}

function claudeGuideBody() {
    return `# CLAUDE.md - ${DISPLAY_NAME} Claude Launch

Use \`.atlasforge/skills/atlas-forge.md\` for the shared policy.

## Preferred runtime
- MCP-first workflow for Claude Desktop or MCP-capable hosts

## Recommended invocation
- \`${INVOCATION_ALIASES[0]}\` for short command intent
- \`${INVOCATION_ALIASES[1]}\` as the shared skill name

## Supporting files
- bridge: \`.atlasforge/bridges/atlas-forge+claude-kit.md\`
- install patch: \`.atlasforge/install/claude/claude-desktop-config.patch.json\`
`;
}

function geminiGuideBody() {
    return `# GEMINI.md - ${DISPLAY_NAME} Gemini Launch

Use \`.atlasforge/skills/atlas-forge.md\` for the shared policy.

## Preferred runtime
- CLI-first and prompt-driven workflow

## Recommended invocation
- \`${INVOCATION_ALIASES[0]}\`
- \`${INVOCATION_ALIASES[1]}\`

## Supporting files
- bridge: \`.atlasforge/bridges/atlas-forge+gemini-kit.md\`
- install patch: \`.atlasforge/install/gemini/gemini-commands.md\`
`;
}

function codexGuideBody() {
    return `# CODEX.md - ${DISPLAY_NAME} Codex Launch

Use \`.atlasforge/skills/atlas-forge.md\` for the shared policy.

## Preferred runtime
- CLI-first workflow with JSON output

## Recommended invocation
- \`${INVOCATION_ALIASES[0]}\`
- \`${INVOCATION_ALIASES[1]}\`

## Supporting files
- bridge: \`.atlasforge/bridges/atlas-forge+codex-kit.md\`
- install patch: \`.atlasforge/install/codex/atlas-forge-skill.md\`
`;
}

function cleanCodeBody() {
    return `# clean-code

- Keep functions small and names explicit.
- Prefer straightforward control flow over cleverness.
- Remove dead code and unused imports or variables.
`;
}

function brainstormingBody() {
    return `# brainstorming

- Clarify goals, constraints, and non-goals before coding.
- Compare 2-3 approaches and choose one with rationale.
- Define acceptance criteria before implementation.
`;
}

function workflowBody() {
    return `# workflow

Standard Atlas Forge task flow:
1. \`status\`
2. \`search\` if context is needed
3. \`start\` for implementation tasks
4. implement and \`add\` when durable memory is warranted
5. \`doctor\`
6. \`close\`
`;
}

function taskLifecycleBody() {
    return `# task-lifecycle

Use Atlas Forge as a stateful policy:
- Read-only analysis does not write memory or close tasks.
- Implementation work should open a session before \`close\`.
- \`doctor\` is the final quality gate before promotion.
`;
}

function quickstartBody(agent: AgentKind) {
    const line =
        agent === 'claude'
            ? '`af_status -> af_search -> af_start_task -> af_add_memory -> af_close_task`'
            : '`status -> search -> start -> add -> doctor -> close`';
    return `# quickstart-${agent}

Preferred ${agent} sequence:
${line}
`;
}

function initScanCommandBody() {
    return `# /atlas init-scan

Run a read-only repo scan.

## Expected behavior
- summarize architecture, entrypoints, scripts, config files, and top risks
- do not edit files
- do not write durable memory
- do not close a task
`;
}

function checkAtlasCommandBody() {
    return `# /atlas check-atlas

Run Atlas Forge readiness checks.

## Expected behavior
- inspect \`verify --json\` and \`status --json\`
- report agent profile, readiness score, and setup gaps
- do not modify repository code
`;
}

function taskStartCommandBody() {
    return `# /atlas task-start

Open or continue an Atlas Forge task.

## Expected behavior
- confirm readiness
- search existing memory if needed
- open a task session before implementation work
`;
}

function bugfixCommandBody() {
    return `# /atlas bugfix

Use Atlas Forge bugfix policy.

## Expected behavior
- identify root cause first
- patch the minimum safe change
- record durable memory only if the lesson is reusable
- run \`doctor\` before \`close\`
`;
}

function featureCommandBody() {
    return `# /atlas feature

Use Atlas Forge feature policy.

## Expected behavior
- inspect current context
- open a task session
- record non-obvious decisions or patterns only
- close the task with a concise outcome summary
`;
}

function releaseCommandBody() {
    return `# /atlas release

Use Atlas Forge release policy.

## Expected behavior
- inspect readiness and current status first
- keep release notes concise
- verify before completion claims
`;
}

function bridgeBody(bridgeId: string, bridgeTarget: string, summary: string) {
    return `# ${bridgeId}

This bridge composes ${DISPLAY_NAME} with \`${bridgeTarget}\`.

## Type
- composition policy, not executable code

## Precedence
1. ${DISPLAY_NAME} shared skill policy
2. Agent launch file
3. This bridge
4. User task content

## Summary
${summary}

## Invocation aliases
- \`${INVOCATION_ALIASES[1]} + ${bridgeTarget}\`
- \`${INVOCATION_ALIASES[0]}\`
`;
}

function codexInstallBody() {
    return `# Codex install patch for ${DISPLAY_NAME}

Install target: Codex skill/config directory outside the repo.

## Suggested alias
- ${INVOCATION_ALIASES[1]}
- ${INVOCATION_ALIASES[0]}

## Suggested mapping
- shared skill source: .atlasforge/skills/atlas-forge.md
- bridge source: .atlasforge/bridges/atlas-forge+codex-kit.md

This file is a patch/install template only. Apply it manually outside the repo.
`;
}

function claudeInstallBody() {
    return `{
  "mcpServers": {
    "atlas-forge": {
      "command": "npx",
      "args": ["-y", "@thaild12042003/atlas-forge", "atlas-forge-mcp"]
    }
  },
  "_comment": "Generated by ${DISPLAY_NAME}. Merge this into your Claude Desktop config outside the repo."
}
`;
}

function geminiInstallBody() {
    return `# Gemini command/install template for ${DISPLAY_NAME}

Suggested aliases:
- ${INVOCATION_ALIASES[1]}
- ${INVOCATION_ALIASES[0]}

Suggested startup instruction:
Use .atlasforge/skills/atlas-forge.md as the shared workflow layer, then apply .atlasforge/bridges/atlas-forge+gemini-kit.md when the task calls for Gemini-specific behavior.
`;
}

function defaultWorkspacePolicy(): WorkspacePolicy {
    return {
        profile_mode: DEFAULTS.profile_mode,
        runtime_patch_state: {
            codex: DEFAULTS.runtime_patch_state.codex,
            claude: DEFAULTS.runtime_patch_state.claude,
            gemini: DEFAULTS.runtime_patch_state.gemini,
        },
    };
}

function normalizeRuntimePatchState(value: unknown): RuntimePatchState {
    if (value === 'required' || value === 'applied' || value === 'skipped') {
        return value;
    }
    return 'required';
}

function readWorkspacePolicy(root: string): WorkspacePolicy {
    const configPath = path.join(root, '.atlasforge', 'config.yaml');
    if (!fs.existsSync(configPath)) {
        return defaultWorkspacePolicy();
    }
    try {
        const parsed = yaml.parse(fs.readFileSync(configPath, 'utf-8')) as Partial<AtlasForgeConfig> | null;
        return {
            profile_mode: parsed?.profile_mode === 'professional' ? 'professional' : 'core',
            runtime_patch_state: {
                codex: normalizeRuntimePatchState(parsed?.runtime_patch_state?.codex),
                claude: normalizeRuntimePatchState(parsed?.runtime_patch_state?.claude),
                gemini: normalizeRuntimePatchState(parsed?.runtime_patch_state?.gemini),
            },
        };
    } catch {
        return defaultWorkspacePolicy();
    }
}

function readTextSafe(filePath: string): string | null {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch {
        return null;
    }
}

function resolveVendorSuperpowersRoot(): string | null {
    const packageRoot = resolveRepoRoot();
    for (const candidate of VENDOR_ROOT_CANDIDATES) {
        const absoluteCandidate = path.join(packageRoot, candidate);
        if (fs.existsSync(absoluteCandidate)) {
            return absoluteCandidate;
        }
    }
    return null;
}

function vendorSuperpowerArtifacts(): DesiredArtifact[] {
    const vendorRoot = resolveVendorSuperpowersRoot();
    if (!vendorRoot) {
        return [];
    }
    const artifacts: DesiredArtifact[] = [];
    for (const skillName of CURATED_VENDOR_SKILLS) {
        const skillPath = path.join(vendorRoot, 'skills', skillName, 'SKILL.md');
        const content = readTextSafe(skillPath);
        if (!content) continue;
        artifacts.push({
            id: `vendor-superpower-skill-${skillName}`,
            kind: 'vendor-skill',
            displayName: `Superpower skill: ${skillName}`,
            category: 'entrypoints',
            path: `.atlasforge/skills/superpowers/${skillName}.md`,
            agentTargets: [...ADAPTIVE_AGENTS],
            managementTier: 'vendor-managed',
            atlasOwner: 'vendor',
            sourceProvenance: VENDOR_PROVENANCE,
            upstreamPath: `skills/${skillName}/SKILL.md`,
            installMode: 'repo-local-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            invocationAliases: [`$${skillName}`],
            body: content,
        });
    }

    for (const fileName of CURATED_VENDOR_COMMANDS) {
        const commandPath = path.join(vendorRoot, 'commands', fileName);
        const content = readTextSafe(commandPath);
        if (!content) continue;
        artifacts.push({
            id: `vendor-superpower-command-${fileName.replace(/\.md$/, '')}`,
            kind: 'command-template',
            displayName: `Superpower command: ${fileName}`,
            category: 'entrypoints',
            path: `.atlasforge/commands/superpowers/${fileName}`,
            agentTargets: [...ADAPTIVE_AGENTS],
            managementTier: 'vendor-managed',
            atlasOwner: 'vendor',
            sourceProvenance: VENDOR_PROVENANCE,
            upstreamPath: `commands/${fileName}`,
            installMode: 'repo-local-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: content,
        });
    }

    for (const fileName of CURATED_VENDOR_HOOKS) {
        const hookPath = path.join(vendorRoot, 'hooks', fileName);
        const content = readTextSafe(hookPath);
        if (!content) continue;
        artifacts.push({
            id: `vendor-superpower-hook-${fileName.replace(/\.[^/.]+$/, '')}`,
            kind: 'hook-template',
            displayName: `Superpower hook template: ${fileName}`,
            category: 'entrypoints',
            path: `.atlasforge/hooks/superpowers/${fileName}`,
            agentTargets: [...ADAPTIVE_AGENTS],
            managementTier: 'vendor-managed',
            atlasOwner: 'vendor',
            sourceProvenance: VENDOR_PROVENANCE,
            upstreamPath: `hooks/${fileName}`,
            installMode: 'guidance-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: content,
        });
    }

    return artifacts;
}

function contentHash(body: string): string {
    return createHash('sha256').update(body, 'utf-8').digest('hex');
}

function renderManagedFile(artifact: DesiredArtifact): string {
    const normalized = normalizedArtifact(artifact);
    const header: ManagedHeader = {
        generated_by: GENERATED_BY,
        artifact_id: normalized.id,
        managed: true,
        version: MANAGED_VERSION,
        canonical_id: CANONICAL_ID,
        display_name: DISPLAY_NAME,
        management_tier: normalized.managementTier,
        atlas_owner: normalized.atlasOwner,
        source_provenance: normalized.sourceProvenance,
        upstream_path: normalized.upstreamPath,
        install_mode: normalized.installMode,
        merge_strategy: normalized.mergeStrategy,
        conflict_policy: normalized.conflictPolicy,
        invocation_aliases: normalized.invocationAliases ?? [],
        content_sha256: contentHash(normalized.body),
    };
    return `---\n${yaml.stringify(header).trimEnd()}\n---\n\n${normalized.body}`;
}

function parseManagedFile(text: string): ParsedManagedFile {
    const match = text.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
    if (!match) {
        return { header: null, body: text };
    }
    try {
        const header = yaml.parse(match[1]) as ManagedHeader;
        return { header, body: match[2] };
    } catch {
        return { header: null, body: text };
    }
}

function isManagedHeader(header: ManagedHeader | null, artifact: DesiredArtifact): boolean {
    return Boolean(
        header &&
            header.generated_by === GENERATED_BY &&
            header.artifact_id === artifact.id &&
            header.managed === true
    );
}

function hasUserDrift(header: ManagedHeader | null, parsed: ParsedManagedFile): boolean {
    if (!header) return false;
    return header.content_sha256 !== contentHash(parsed.body);
}

function expectedAgents(
    requestedAgent: AgentSelection,
    appliedAgent: AgentKind,
    profileMode: ProfileMode,
    runtimeOnly = false,
): AgentKind[] {
    if (runtimeOnly) return [appliedAgent];
    if (profileMode === 'professional') return [...ADAPTIVE_AGENTS];
    return requestedAgent === 'all' ? [...ADAPTIVE_AGENTS] : [appliedAgent];
}

function desiredArtifactsFor(
    requestedAgent: AgentSelection,
    appliedAgent: AgentKind,
    profileMode: ProfileMode,
    runtimeOnly = false,
): DesiredArtifact[] {
    const agents = expectedAgents(requestedAgent, appliedAgent, profileMode, runtimeOnly);
    const artifacts: DesiredArtifact[] = [
        {
            id: 'atlas-forge-root-shared',
            kind: 'agent-guide',
            displayName: 'Atlas Forge shared launch file',
            category: 'entrypoints',
            path: 'AGENTS.md',
            agentTargets: [...ADAPTIVE_AGENTS],
            invocationAliases: INVOCATION_ALIASES,
            installMode: 'repo-local-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: sharedRootBody(),
            legacyContents: [sharedRootBody()],
        },
        {
            id: 'atlas-forge-skill',
            kind: 'shared-skill',
            displayName: 'Atlas Forge shared skill',
            category: 'entrypoints',
            path: '.atlasforge/skills/atlas-forge.md',
            agentTargets: [...ADAPTIVE_AGENTS],
            invocationAliases: INVOCATION_ALIASES,
            installMode: 'repo-local-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: sharedSkillBody(),
        },
        {
            id: 'atlas-forge-skill-clean-code',
            kind: 'support-skill',
            displayName: 'Atlas Forge support skill: clean-code',
            category: 'entrypoints',
            path: '.atlasforge/skills/clean-code.md',
            agentTargets: [...ADAPTIVE_AGENTS],
            installMode: 'repo-local-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: cleanCodeBody(),
            legacyContents: [cleanCodeBody()],
        },
        {
            id: 'atlas-forge-skill-brainstorming',
            kind: 'support-skill',
            displayName: 'Atlas Forge support skill: brainstorming',
            category: 'entrypoints',
            path: '.atlasforge/skills/brainstorming.md',
            agentTargets: [...ADAPTIVE_AGENTS],
            installMode: 'repo-local-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: brainstormingBody(),
            legacyContents: [brainstormingBody()],
        },
        {
            id: 'atlas-forge-skill-workflow',
            kind: 'support-skill',
            displayName: 'Atlas Forge support skill: workflow',
            category: 'entrypoints',
            path: '.atlasforge/skills/workflow.md',
            agentTargets: [...ADAPTIVE_AGENTS],
            installMode: 'repo-local-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: workflowBody(),
            legacyContents: [workflowBody()],
        },
        {
            id: 'atlas-forge-workflow-task-lifecycle',
            kind: 'workflow-template',
            displayName: 'Atlas Forge workflow template: task-lifecycle',
            category: 'entrypoints',
            path: '.atlasforge/workflows/task-lifecycle.md',
            agentTargets: [...ADAPTIVE_AGENTS],
            installMode: 'repo-local-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: taskLifecycleBody(),
            legacyContents: [taskLifecycleBody()],
        },
        {
            id: 'atlas-forge-command-init-scan',
            kind: 'command-template',
            displayName: 'Atlas Forge command: init-scan',
            category: 'entrypoints',
            path: '.atlasforge/commands/init-scan.md',
            agentTargets: [...ADAPTIVE_AGENTS],
            invocationAliases: ['/atlas init-scan'],
            installMode: 'repo-local-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: initScanCommandBody(),
        },
        {
            id: 'atlas-forge-command-check-atlas',
            kind: 'command-template',
            displayName: 'Atlas Forge command: check-atlas',
            category: 'entrypoints',
            path: '.atlasforge/commands/check-atlas.md',
            agentTargets: [...ADAPTIVE_AGENTS],
            invocationAliases: ['/atlas check-atlas'],
            installMode: 'repo-local-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: checkAtlasCommandBody(),
        },
        {
            id: 'atlas-forge-command-task-start',
            kind: 'command-template',
            displayName: 'Atlas Forge command: task-start',
            category: 'entrypoints',
            path: '.atlasforge/commands/task-start.md',
            agentTargets: [...ADAPTIVE_AGENTS],
            invocationAliases: ['/atlas task-start'],
            installMode: 'repo-local-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: taskStartCommandBody(),
        },
        {
            id: 'atlas-forge-command-bugfix',
            kind: 'command-template',
            displayName: 'Atlas Forge command: bugfix',
            category: 'entrypoints',
            path: '.atlasforge/commands/bugfix.md',
            agentTargets: [...ADAPTIVE_AGENTS],
            invocationAliases: ['/atlas bugfix'],
            installMode: 'repo-local-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: bugfixCommandBody(),
        },
        {
            id: 'atlas-forge-command-feature',
            kind: 'command-template',
            displayName: 'Atlas Forge command: feature',
            category: 'entrypoints',
            path: '.atlasforge/commands/feature.md',
            agentTargets: [...ADAPTIVE_AGENTS],
            invocationAliases: ['/atlas feature'],
            installMode: 'repo-local-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: featureCommandBody(),
        },
        {
            id: 'atlas-forge-command-release',
            kind: 'command-template',
            displayName: 'Atlas Forge command: release',
            category: 'entrypoints',
            path: '.atlasforge/commands/release.md',
            agentTargets: [...ADAPTIVE_AGENTS],
            invocationAliases: ['/atlas release'],
            installMode: 'repo-local-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: releaseCommandBody(),
        },
        {
            id: 'atlas-forge-bridge-superpower',
            kind: 'bridge-template',
            displayName: 'Atlas Forge bridge: superpower',
            category: 'bridges',
            path: '.atlasforge/bridges/atlas-forge+superpower.md',
            agentTargets: [...ADAPTIVE_AGENTS],
            invocationAliases: ['$Atlas Forge + superpower'],
            installMode: 'guidance-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: bridgeBody('atlas-forge+superpower', 'superpower', 'Use Atlas Forge lifecycle and memory policy with superpower planning or debugging discipline.'),
        },
        {
            id: 'atlas-forge-bridge-claude-kit',
            kind: 'bridge-template',
            displayName: 'Atlas Forge bridge: claude-kit',
            category: 'bridges',
            path: '.atlasforge/bridges/atlas-forge+claude-kit.md',
            agentTargets: ['claude'],
            invocationAliases: ['$Atlas Forge + claude-kit'],
            installMode: 'guidance-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: bridgeBody('atlas-forge+claude-kit', 'claude-kit', 'Use Atlas Forge lifecycle with Claude-oriented MCP and prompt conventions.'),
        },
        {
            id: 'atlas-forge-bridge-codex-kit',
            kind: 'bridge-template',
            displayName: 'Atlas Forge bridge: codex-kit',
            category: 'bridges',
            path: '.atlasforge/bridges/atlas-forge+codex-kit.md',
            agentTargets: ['codex'],
            invocationAliases: ['$Atlas Forge + codex-kit'],
            installMode: 'guidance-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: bridgeBody('atlas-forge+codex-kit', 'codex-kit', 'Use Atlas Forge lifecycle with Codex CLI-first and JSON-first conventions.'),
        },
        {
            id: 'atlas-forge-bridge-gemini-kit',
            kind: 'bridge-template',
            displayName: 'Atlas Forge bridge: gemini-kit',
            category: 'bridges',
            path: '.atlasforge/bridges/atlas-forge+gemini-kit.md',
            agentTargets: ['gemini'],
            invocationAliases: ['$Atlas Forge + gemini-kit'],
            installMode: 'guidance-only',
            mergeStrategy: 'replace-if-unmodified',
            conflictPolicy: 'preserve-user',
            body: bridgeBody('atlas-forge+gemini-kit', 'gemini-kit', 'Use Atlas Forge lifecycle with Gemini CLI-first and prompt-driven conventions.'),
        },
    ];

    const rootGuides: Record<AgentKind, DesiredArtifact> = {
        claude: {
            id: 'atlas-forge-root-claude',
            kind: 'agent-guide',
            category: 'entrypoints',
            path: 'CLAUDE.md',
            agentTargets: ['claude'],
            invocationAliases: INVOCATION_ALIASES,
            body: claudeGuideBody(),
            legacyContents: [claudeGuideBody()],
        },
        gemini: {
            id: 'atlas-forge-root-gemini',
            kind: 'agent-guide',
            category: 'entrypoints',
            path: 'GEMINI.md',
            agentTargets: ['gemini'],
            invocationAliases: INVOCATION_ALIASES,
            body: geminiGuideBody(),
            legacyContents: [geminiGuideBody()],
        },
        codex: {
            id: 'atlas-forge-root-codex',
            kind: 'agent-guide',
            category: 'entrypoints',
            path: 'CODEX.md',
            agentTargets: ['codex'],
            invocationAliases: INVOCATION_ALIASES,
            body: codexGuideBody(),
            legacyContents: [codexGuideBody()],
        },
    };

    const quickstarts: Record<AgentKind, DesiredArtifact> = {
        claude: {
            id: 'atlas-forge-quickstart-claude',
            kind: 'workflow-template',
            category: 'entrypoints',
            path: '.atlasforge/workflows/quickstart-claude.md',
            agentTargets: ['claude'],
            body: quickstartBody('claude'),
            legacyContents: [quickstartBody('claude')],
        },
        gemini: {
            id: 'atlas-forge-quickstart-gemini',
            kind: 'workflow-template',
            category: 'entrypoints',
            path: '.atlasforge/workflows/quickstart-gemini.md',
            agentTargets: ['gemini'],
            body: quickstartBody('gemini'),
            legacyContents: [quickstartBody('gemini')],
        },
        codex: {
            id: 'atlas-forge-quickstart-codex',
            kind: 'workflow-template',
            category: 'entrypoints',
            path: '.atlasforge/workflows/quickstart-codex.md',
            agentTargets: ['codex'],
            body: quickstartBody('codex'),
            legacyContents: [quickstartBody('codex')],
        },
    };

    const installs: Record<AgentKind, DesiredArtifact[]> = {
        claude: [
            {
                id: 'atlas-forge-install-claude-config',
                kind: 'external-patch',
                category: 'external_patch_files',
                path: '.atlasforge/install/claude/claude-desktop-config.patch.json',
                agentTargets: ['claude'],
                invocationAliases: INVOCATION_ALIASES,
                body: claudeInstallBody(),
            },
        ],
        gemini: [
            {
                id: 'atlas-forge-install-gemini-commands',
                kind: 'external-patch',
                category: 'external_patch_files',
                path: '.atlasforge/install/gemini/gemini-commands.md',
                agentTargets: ['gemini'],
                invocationAliases: INVOCATION_ALIASES,
                body: geminiInstallBody(),
            },
        ],
        codex: [
            {
                id: 'atlas-forge-install-codex-skill',
                kind: 'external-patch',
                category: 'external_patch_files',
                path: '.atlasforge/install/codex/atlas-forge-skill.md',
                agentTargets: ['codex'],
                invocationAliases: INVOCATION_ALIASES,
                body: codexInstallBody(),
            },
        ],
    };

    for (const agent of agents) {
        artifacts.push(rootGuides[agent]);
        artifacts.push(quickstarts[agent]);
        for (const install of installs[agent]) {
            artifacts.push(install);
        }
    }

    if (profileMode === 'professional') {
        artifacts.push(...vendorSuperpowerArtifacts());
    }

    return artifacts;
}

function toMetadata(artifact: DesiredArtifact, status: EntryArtifactMetadata['status']): EntryArtifactMetadata {
    const normalized = normalizedArtifact(artifact);
    return {
        id: normalized.id,
        kind: normalized.kind,
        display_name: normalized.displayName,
        path: normalized.path,
        agent_targets: normalized.agentTargets,
        managed: true,
        management_tier: normalized.managementTier,
        atlas_owner: normalized.atlasOwner,
        generated_by: GENERATED_BY,
        version: MANAGED_VERSION,
        status,
        source_provenance: normalized.sourceProvenance,
        upstream_path: normalized.upstreamPath,
        install_mode: normalized.installMode,
        conflict_policy: normalized.conflictPolicy,
        merge_strategy: normalized.mergeStrategy,
        invocation_aliases: normalized.invocationAliases ?? [],
    };
}

function categorize(
    artifacts: EntryArtifactMetadata[],
): Pick<InitBootstrapReport, 'entrypoints' | 'bridges' | 'external_patch_files'> {
    return {
        entrypoints: artifacts.filter((artifact) => artifact.kind !== 'bridge-template' && artifact.kind !== 'external-patch'),
        bridges: artifacts.filter((artifact) => artifact.kind === 'bridge-template'),
        external_patch_files: artifacts.filter((artifact) => artifact.kind === 'external-patch'),
    };
}

function syncArtifact(root: string, artifact: DesiredArtifact, dryRun: boolean) {
    const absolutePath = path.join(root, artifact.path);
    const desired = renderManagedFile(artifact);
    const existing = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf-8') : null;

    if (existing === null) {
        if (!dryRun) {
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
            fs.writeFileSync(absolutePath, desired, 'utf-8');
        }
        return { status: 'created' as const };
    }

    const parsed = parseManagedFile(existing);
    if (isManagedHeader(parsed.header, artifact)) {
        if (existing === desired) {
            return { status: 'skipped' as const };
        }
        if (hasUserDrift(parsed.header, parsed)) {
            return { status: 'drifted' as const };
        }
        if (!dryRun) {
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
            fs.writeFileSync(absolutePath, desired, 'utf-8');
        }
        return { status: 'updated' as const };
    }

    if (artifact.legacyContents?.includes(existing)) {
        if (!dryRun) {
            fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
            fs.writeFileSync(absolutePath, desired, 'utf-8');
        }
        return { status: 'updated' as const };
    }

    return { status: 'skipped' as const };
}

function inspectArtifact(root: string, artifact: DesiredArtifact): EntryArtifactMetadata['status'] {
    const absolutePath = path.join(root, artifact.path);
    if (!fs.existsSync(absolutePath)) {
        return 'missing';
    }
    const parsed = parseManagedFile(fs.readFileSync(absolutePath, 'utf-8'));
    if (isManagedHeader(parsed.header, artifact) && hasUserDrift(parsed.header, parsed)) {
        return 'drifted';
    }
    return 'present';
}

function requiredArtifactPaths(
    requestedAgent: AgentSelection,
    appliedAgent: AgentKind,
    profileMode: ProfileMode,
    runtimeOnly = false,
    includeAllPatchArtifacts = false,
): string[] {
    return desiredArtifactsFor(requestedAgent, appliedAgent, profileMode, runtimeOnly)
        .filter(
            (artifact) =>
                includeAllPatchArtifacts ||
                artifact.category !== 'external_patch_files' ||
                artifact.agentTargets.includes(appliedAgent),
        )
        .map((artifact) => artifact.path);
}

function scanEntryLayer(
    root: string,
    requestedAgent: AgentSelection,
    appliedAgent: AgentKind,
    profileMode: ProfileMode,
    runtimeOnly = false,
) {
    const metadata = desiredArtifactsFor(requestedAgent, appliedAgent, profileMode, runtimeOnly).map((artifact) =>
        toMetadata(artifact, inspectArtifact(root, artifact))
    );
    return categorize(metadata);
}

export function isAgentSelection(value: string): value is AgentSelection {
    return AGENT_SELECTIONS.includes(value as AgentSelection);
}

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
        signals.push('root:AGENTS.md');
    }

    if (hasFile(root, 'CODEX.md')) {
        codexScore += 3;
        signals.push('root:CODEX.md');
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
            const parsed = JSON.parse(packageJson) as Record<string, unknown>;
            const deps = {
                ...((parsed.dependencies as Record<string, string> | undefined) || {}),
                ...((parsed.devDependencies as Record<string, string> | undefined) || {}),
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

function confidenceFromScores(top: number, second: number): AgentConfidence {
    if (top <= 0) return 'low';
    if (top >= 5 && top - second >= 2) return 'high';
    return 'medium';
}

function detectByScores(scores: SignalMap): { detected_agent: AgentKind; confidence: AgentConfidence } {
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
    const applied_agent = requestedAgent === 'auto' || requestedAgent === 'all' ? detected.detected_agent : requestedAgent;
    const confidence = requestedAgent === 'auto' || requestedAgent === 'all' ? detected.confidence : 'high';
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

export function bootstrapAdaptiveArtifacts(
    root: string,
    options: BootstrapOptions = {},
): { agent_profile: AgentProfile; bootstrap: InitBootstrapReport } {
    const requestedAgent = options.requestedAgent ?? 'auto';
    const dryRun = Boolean(options.dryRun);
    const agentProfile = detectAgentProfile(root, requestedAgent);
    const policy = readWorkspacePolicy(root);
    const effectiveProfileMode: ProfileMode = requestedAgent === 'all' ? 'professional' : policy.profile_mode;
    const report: InitBootstrapReport = {
        created: [],
        updated: [],
        skipped: [],
        drifted: [],
        dry_run: dryRun,
        entrypoints: [],
        bridges: [],
        external_patch_files: [],
    };

    const metadata: EntryArtifactMetadata[] = [];
    for (const artifact of desiredArtifactsFor(requestedAgent, agentProfile.applied_agent, effectiveProfileMode)) {
        const result = syncArtifact(root, artifact, dryRun);
        report[result.status].push(artifact.path);
        metadata.push(toMetadata(artifact, result.status));
    }

    const grouped = categorize(metadata);
    report.entrypoints = grouped.entrypoints;
    report.bridges = grouped.bridges;
    report.external_patch_files = grouped.external_patch_files;

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
    },
): AgentReadiness {
    const profile = detectAgentProfile(root, requestedAgent);
    const workspacePolicy = readWorkspacePolicy(root);
    const selectedRuntime = profile.applied_agent;
    const gaps: string[] = [];

    let score = 2;

    const selectedRequired = requiredArtifactPaths(requestedAgent, selectedRuntime, workspacePolicy.profile_mode, true);
    const selectedPresent = selectedRequired.filter((rel) => hasFile(root, rel)).length;
    score += Number(((selectedPresent / Math.max(selectedRequired.length, 1)) * 2).toFixed(1));

    const runtimes = {
        codex: { ready: true, patch_state: workspacePolicy.runtime_patch_state.codex },
        claude: { ready: true, patch_state: workspacePolicy.runtime_patch_state.claude },
        gemini: { ready: true, patch_state: workspacePolicy.runtime_patch_state.gemini },
    } as AgentReadiness['runtimes'];

    for (const runtime of ADAPTIVE_AGENTS) {
        const runtimeLayer = scanEntryLayer(root, runtime, runtime, workspacePolicy.profile_mode, true);
        const runtimeArtifacts = [...runtimeLayer.entrypoints, ...runtimeLayer.bridges, ...runtimeLayer.external_patch_files];
        const patchState = workspacePolicy.runtime_patch_state[runtime];
        const runtimeIssues = runtimeArtifacts.filter(
            (artifact) =>
                artifact.kind !== 'hook-template' &&
                !(artifact.kind === 'external-patch' && patchState !== 'required') &&
                (artifact.status === 'missing' || artifact.status === 'drifted'),
        );
        const patchExists = hasFile(root, RUNTIME_PATCH_PATHS[runtime]);
        const patchOk = patchState === 'required' ? patchExists : true;
        const ready = runtimeIssues.length === 0 && patchOk;
        runtimes[runtime].ready = ready;

        if (runtime === selectedRuntime) {
            for (const issue of runtimeIssues) {
                const prefix = issue.status === 'missing' ? 'missing artifact' : 'managed artifact drifted';
                gaps.push(`${prefix}: ${issue.path}`);
            }
            if (!patchOk) {
                gaps.push(`runtime patch required but missing for ${runtime}: ${RUNTIME_PATCH_PATHS[runtime]}`);
            }
        }
    }

    const selectedRuntimeReady = runtimes[selectedRuntime].ready;
    if (selectedRuntimeReady) {
        score += 1;
    } else {
        gaps.push(`selected runtime is not ready: ${selectedRuntime}`);
    }

    let professionalKitReady = false;
    if (workspacePolicy.profile_mode === 'professional') {
        const professionalLayer = scanEntryLayer(root, 'all', selectedRuntime, 'professional');
        const professionalIssues = [
            ...professionalLayer.entrypoints,
            ...professionalLayer.bridges,
            ...professionalLayer.external_patch_files,
        ].filter((artifact) => artifact.kind !== 'hook-template' && (artifact.status === 'missing' || artifact.status === 'drifted'));
        professionalKitReady = professionalIssues.length === 0;
        const professionalRequired = requiredArtifactPaths('all', selectedRuntime, 'professional', false, true);
        const professionalPresent = professionalRequired.filter((rel) => hasFile(root, rel)).length;
        score += Number(((professionalPresent / Math.max(professionalRequired.length, 1)) * 2).toFixed(1));
        if (professionalKitReady) {
            score += 1;
        } else {
            gaps.push('professional kit is not ready (missing or drifted managed artifacts)');
        }
    } else {
        score += 1;
    }

    const signalMap = collectSignals(root);
    if (selectedRuntime === 'claude') {
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
    const level: AgentReadiness['level'] = normalized >= 8.5 ? 'excellent' : normalized >= 6 ? 'good' : 'basic';
    const notReady = ADAPTIVE_AGENTS.filter((runtime) => !runtimes[runtime].ready);
    const runtime_readiness_dashboard: AgentReadiness['runtime_readiness_dashboard'] = {
        selected: {
            agent: selectedRuntime,
            ready: selectedRuntimeReady,
            patch_state: runtimes[selectedRuntime].patch_state,
        },
        agents: runtimes,
        summary: {
            ready_count: ADAPTIVE_AGENTS.length - notReady.length,
            total: ADAPTIVE_AGENTS.length,
            not_ready: notReady,
        },
    };

    return {
        agent_profile: profile,
        profile: workspacePolicy.profile_mode,
        selected_runtime: selectedRuntime,
        selected_runtime_ready: selectedRuntimeReady,
        professional_kit_ready: professionalKitReady,
        runtimes,
        runtime_readiness_dashboard,
        agent_readiness_score: normalized,
        level,
        gaps,
    };
}

export function getEntryLayerMetadata(root: string, requestedAgent: AgentSelection = 'auto') {
    const profile = detectAgentProfile(root, requestedAgent);
    const workspacePolicy = readWorkspacePolicy(root);
    return scanEntryLayer(root, requestedAgent, profile.applied_agent, workspacePolicy.profile_mode);
}
