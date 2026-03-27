# Agent Prompt Kit

Copy-paste prompts for Atlas Forge workflows. Prefer `--json` for deterministic agent output.

## Quick Pick

| Need | Best agent path | First move |
|---|---|---|
| MCP IDE workflow | Claude / Cursor | `af_init` then `af_status` |
| CLI implementation workflow | Codex / Gemini | `init --agent <runtime> --json` then `verify --json` |
| Orchestration and long task | Antigravity | `init --agent auto --json` then `status --json` |

## Core Prompts

### Repo Scan (read-only)

```text
/init
Scan the repo before changing code.
Return architecture, entrypoints, scripts, config files, top risks, and a short plan.
Do not edit files yet. Do not write memory.
```

### Bug Fix

```text
Use Atlas Forge.
Flow: status -> search -> start -> fix -> add memory -> doctor -> close.
Find root cause first, patch the minimum safe change, and run relevant tests before close.
```

### Feature Work

```text
Use Atlas Forge for this feature.
Run verify/status in JSON first, then implement the smallest safe change.
Capture only reusable decisions/patterns. Run doctor before close.
```

### Publish / Release

```text
Use Atlas Forge in release mode.
Check verify/status first and include runtime_readiness_dashboard in your summary.
Then run release gate commands and prepare concise release notes.
```

## Agent Launch Lines

### Claude / Cursor

```text
Use Atlas Forge through MCP.
Flow: af_init -> af_status -> af_search -> af_start_task -> af_add_memory -> af_close_task.
```

### Codex

```text
Use Atlas Forge as repo memory system.
Flow: status -> search -> start -> implement -> add memories -> doctor -> close.
Prefer --json and include runtime_readiness_dashboard when reporting readiness.
```

### Gemini

```text
Use Atlas Forge CLI-first.
Start with init/verify/status in JSON mode.
Keep changes minimal and finish with doctor + close.
```

### Antigravity

```text
Use Atlas Forge for orchestration.
Start with init + verify/status, then run lifecycle with doctor before close.
```

## Shared Rules

- Start with `status` or `af_status`.
- Search before implementation when context exists.
- Keep durable memory focused on reusable knowledge.
- Run `doctor` before `close`.
- For readiness reporting, include:
  - `profile`
  - `selected_runtime_ready`
  - `professional_kit_ready`
  - `runtime_readiness_dashboard`
