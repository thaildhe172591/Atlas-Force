# Codex Integration (CLI/file-memory-first)

## Quickstart

```bash
npx atlas-forge init --agent codex
npx atlas-forge optimize --agent codex --json
npx atlas-forge verify --json
atlas-forge status --json
atlas-forge search "<query>" --json
atlas-forge start "<task summary>" --json
atlas-forge add --type code-pattern --title "<title>" --summary "<summary>" --json
atlas-forge doctor --json
atlas-forge close "<outcome summary>" --json
```

## Recommended Setup

| Scenario | Best choice | Why |
|---|---|---|
| Team repo / CI | `npm i -D @thaild12042003/atlas-forge` | Locks the repo to one version and keeps behavior reproducible |
| Daily local work | `npx atlas-forge ...` | Uses the repo version without a global install |
| Quick tryout | `npm i -g @thaild12042003/atlas-forge` | Fastest for experimenting across many repos |

## Best Skill Stack

- `systematic-debugging` for bugs, flaky tests, and build failures.
- `writing-plans` before larger implementation work.
- `verification-before-completion` before commit, publish, or close.

## Prompt Templates

### Scan Repo

```text
/init
Scan the repo before changing code.
Summarize architecture, entrypoints, scripts, config files, and top risks.
Return a short implementation plan only. Do not edit files yet.
```

### Bug Fix

```text
Use Atlas Forge.
Flow:
status -> search -> start -> fix -> add memory -> doctor -> close
Identify the root cause first, then make the minimum safe change.
Run the relevant tests before closing.
```

### Feature Work

```text
Use Atlas Forge for this feature.
Check status and search first.
Keep the implementation minimal and preserve existing behavior.
Record key decisions with code-pattern memory entries.
Finish with doctor and close.
```

### Release Polish

```text
Use Atlas Forge in release mode.
Check status, verify, and docs first.
Improve user-facing guidance and examples without changing core behavior.
Keep the output concise and publish-ready.
```

## One-Screen Flow

- `init --agent codex` creates shared `AGENTS.md`, `CODEX.md`, `.atlasforge/skills/`, and `.atlasforge/workflows/` without overwriting user files.
- Use `status` and `search` before coding.
- Capture reusable implementation details with `code-pattern`.
- Finish with `doctor` and `close`.

## Troubleshooting

- Invalid type in `add`: use supported memory types listed in `README.md`.
- Close failures: inspect `doctor` output before retrying.
- Missing project grounding: run `optimize --agent codex --json`.
