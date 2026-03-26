# Codex Integration (CLI/file-memory-first)

## Goal

Use Atlas Forge via CLI JSON mode and `.atlasforge` as local memory grounding.

## Setup

```bash
npx atlas-forge init
npx atlas-forge verify --json
```

## Workflow

```bash
atlas-forge status --json
atlas-forge search "<query>" --json
atlas-forge start "<task summary>" --json
atlas-forge add --type decision --title "<title>" --summary "<summary>" --json
atlas-forge doctor --json
atlas-forge close "<outcome summary>" --json
```

## Project instruction snippet

Use `.atlasforge/canonical/canonical.jsonl` for prior decisions and run Atlas Forge commands with `--json` for stateful memory operations.

## Verify

- `verify --json` returns `ok: true`.
- `status --json` includes `snapshot` and `active_session`.

## Common issues

- Invalid type in `add`: use supported memory types listed in `README.md`.
- Close failures: inspect `doctor` output before retrying.
