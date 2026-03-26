# Agent Prompt Kit

Use these prompts as copy-paste starting points. Keep `--json` on when you want machine-readable output.

## Quick Pick

| Need | Best agent | First move |
|---|---|---|
| IDE-native memory | Claude / Cursor | `af_init` |
| CLI-first repo work | Codex / Gemini | `init --agent ... --json` |
| Task orchestration | Antigravity | `init --agent auto --json` |

## Task Prompts

### Repo Scan

```text
/init
Scan the repo before changing code.
Return architecture, entrypoints, scripts, config files, top risks, and a short plan.
Do not edit files yet.
```

### Bug Fix

```text
Use Atlas Forge.
Flow: status -> search -> start -> fix -> add memory -> doctor -> close.
Identify root cause first, patch the minimum safe change, and run the relevant tests before closing.
```

### Feature Work

```text
Use Atlas Forge for this feature.
Check status and search first.
Keep the implementation minimal, preserve existing behavior, and capture key decisions with code-pattern entries.
Finish with doctor and close.
```

### Release Polish

```text
Use Atlas Forge in release mode.
Check status, verify, and docs first.
Improve user-facing guidance and examples without changing core behavior.
Keep the output concise and publish-ready.
```

## Agent-Specific Launch Lines

### Claude

```text
Use Atlas Forge through MCP.
Flow: af_init -> af_status -> af_search -> af_start_task -> af_add_memory -> af_close_task.
Keep the session summary concise.
```

### Cursor

```text
Use Atlas Forge through MCP inside the IDE.
Open with af_init and af_status, then search before editing.
Capture important decisions with af_add_memory and close with af_close_task.
```

### Codex

```text
Use Atlas Forge as the repo memory system.
Flow: status -> search -> start -> implement -> add memories -> doctor -> close.
Prefer --json and do not close until doctor passes.
```

### Gemini

```text
Use Atlas Forge CLI-first.
Start with init --agent gemini --json, then verify and status.
Keep changes minimal, record decisions, and close with a short outcome summary.
```

### Antigravity

```text
Use Atlas Forge for task orchestration.
Start with init --agent auto --json, then status, search, and doctor before close.
Prioritize clean handoffs, diagnostics, and promotion discipline.
```

## Shared Rules

- Start with `status` or `af_status` before editing.
- Search first when the task has existing context.
- Record decisions with `code-pattern` or `decision`.
- Run `doctor` before `close`.
- Use `verify --json` when you need readiness and setup checks.

## Skill Combos

Use these when you want Atlas Forge plus a focused skill workflow:

| Situation | Combine with these skills | What it gives you |
|---|---|---|
| New feature or UX change | `brainstorming` -> `writing-plans` | Clear design before code, then a step-by-step plan |
| Hard bug or flaky test | `systematic-debugging` -> `verification-before-completion` | Root-cause analysis plus evidence-based completion |
| Release or publish work | `verification-before-completion` -> `git-ops-pro` | Safer checks before commit, tag, or publish |
| Large repo onboarding | `documentation-templates` -> `workflow-status` | Better docs shape and clearer progress reporting |

### Example: Feature + Brainstorming

```text
Use Atlas Forge and the brainstorming skill.
First scan the repo, describe 2-3 approaches, and ask for design approval.
After approval, use Atlas Forge status/search/start, then implement, add memory, doctor, and close.
```

### Example: Bug Fix + Systematic Debugging

```text
Use Atlas Forge and the systematic-debugging skill.
Investigate the root cause first, reproduce the issue, and only then patch the minimum change.
Before closing, run verification commands and record the result in Atlas Forge.
```

### Example: Release + Verification

```text
Use Atlas Forge with verification-before-completion and git-ops-pro.
Check status, verify readiness, confirm the diff, and only then commit or publish.
Prefer concise release notes and a clean close summary.
```
