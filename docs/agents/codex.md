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

## One-Screen Flow

- `init --agent codex` creates `AGENTS.md`, `.atlasforge/skills/`, and `.atlasforge/workflows/` without overwriting user files.
- Use `status` and `search` before coding.
- Capture reusable implementation details with `code-pattern`.
- Finish with `doctor` and `close`.

## Troubleshooting

- Invalid type in `add`: use supported memory types listed in `README.md`.
- Close failures: inspect `doctor` output before retrying.
- Missing project grounding: run `optimize --agent codex --json`.
