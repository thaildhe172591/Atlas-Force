# CODEX.md - Atlas Forge Codex Workflow

Codex should use Atlas Forge CLI in JSON mode.

## Task lifecycle
1. `atlas-forge status --json`
2. `atlas-forge search "<query>" --json`
3. `atlas-forge start "<task summary>" --json`
4. `atlas-forge add --type code-pattern --title "<title>" --summary "<summary>" --json`
5. `atlas-forge doctor --json`
6. `atlas-forge close "<outcome summary>" --json`

## Notes
- Use `AGENTS.md` for shared repo rules.
- Prefer `--json` so automation can parse results safely.
- Run `atlas-forge verify --json` when you need setup/readiness checks.
