# GEMINI.md - Atlas Forge Memory Protocol

Gemini should use Atlas Forge via CLI with JSON output.

## Required workflow

1. `atlas-forge status --json`
2. `atlas-forge search "<query>" --json`
3. `atlas-forge start "<task summary>" --json`
4. `atlas-forge add --type decision --title "<title>" --summary "<summary>" --json`
5. `atlas-forge doctor --json`
6. `atlas-forge close "<outcome summary>" --json`

## Notes

- If `.atlasforge/` is missing, run `atlas-forge init`.
- Prefer `--json` so automation can parse results safely.
- For cross-agent standards, read `AI_PROTOCOL.md`.
