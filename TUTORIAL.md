# Atlas Forge Tutorial

This tutorial helps users and agents adopt Atlas Forge in a predictable, production-friendly workflow.

## Learning Goals

After this guide, you can:

- initialize a workspace
- run a complete memory lifecycle
- debug failed promotions
- automate with JSON output

## Mental Model

Atlas Forge works with two memory zones:

- `staging`: draft memories during active work
- `canonical`: verified memories promoted for reuse

Lifecycle:

1. `start` task context
2. `add` decisions/patterns while implementing
3. `doctor` validate staging quality
4. `close` promote valid entries

## Hands-on Walkthrough

### Step 1: Initialize

```bash
npx atlas-forge init --agent auto
```

Expected outcome:
- `.atlasforge/` created
- default `config.yaml` available
- profile-specific root guidance (`CLAUDE.md`/`GEMINI.md`/`AGENTS.md`) auto-created when missing
- `.atlasforge/skills/` + `.atlasforge/workflows/` seeded when missing

Optional re-sync (non-destructive):

```bash
npx atlas-forge optimize --agent auto --json
```

### Step 2: Start a Task Session

```bash
npx atlas-forge start "Implement billing retries"
```

Expected outcome:
- one active session
- preflight context loaded when available

### Step 3: Capture Knowledge During Work

```bash
npx atlas-forge add \
  --type decision \
  --title "Retry policy" \
  --summary "Use exponential backoff with jitter"
```

Use `code-pattern` for reusable templates:

```bash
npx atlas-forge add \
  --type code-pattern \
  --title "Idempotent retry wrapper" \
  --summary "Safe wrapper for retriable operations"
```

### Step 4: Validate Before Promotion

```bash
npx atlas-forge doctor
```

Expected outcome:
- diagnostics pass, warn, or fail
- actionable checks for bad entries

### Step 5: Close and Promote

```bash
npx atlas-forge close "Billing retry implementation complete"
```

## Automation Mode (`--json`)

For agents and scripts, always prefer machine-readable responses:

```bash
npx atlas-forge status --json
npx atlas-forge search "retry" --json
npx atlas-forge doctor --json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Atlas Forge is not initialized` | missing `.atlasforge` | run `atlas-forge init` |
| invalid memory type | unsupported `--type` value | use supported types from `README.md` |
| doctor failures | malformed entry or bad evidence refs | inspect `doctor.checks`, repair entry, rerun |
| close does not promote expected records | promote mode or failed checks | run `status` + `doctor` to inspect state |

Note: new workspaces default to `promote_mode: direct`.

## Next Steps

- Read release gate: `docs/release-checklist.md`
- Configure MCP: `README.md` MCP section
- Pick agent-specific guide in `docs/agents/`
