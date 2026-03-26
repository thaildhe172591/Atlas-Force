# GEMINI.md - Atlas Forge Agent Protocol

Use Atlas Forge as the memory system of record for this repository.

## Required workflow

1. `atlas-forge status --json`
2. `atlas-forge search "<query>" --json`
3. `atlas-forge start "<task summary>" --json`
4. `atlas-forge add --type decision --title "<title>" --summary "<summary>" --json`
5. `atlas-forge doctor --json`
6. `atlas-forge close "<outcome summary>" --json`

## Rules

- Prefer `--json` for machine-readable automation.
- Treat `.atlasforge/` as memory source of truth.
- Capture major decisions and reusable patterns during implementation.
- Close every completed task with a concise outcome summary.
