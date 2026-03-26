# Gemini Integration (CLI-first)

## Goal

Use Atlas Forge commands as a deterministic memory protocol in Gemini sessions.

## Workflow checklist

1. `atlas-forge status --json`
2. `atlas-forge search "<query>" --json`
3. `atlas-forge start "<task summary>" --json`
4. `atlas-forge add --type decision --title "<title>" --summary "<summary>" --json`
5. `atlas-forge doctor --json`
6. `atlas-forge close "<outcome summary>" --json`

## Conventions

- Use `decision` for architecture tradeoffs.
- Use `module` for component responsibility updates.
- Use `code-pattern` for reusable implementation templates.

## Verify

- Run `atlas-forge verify --json` before first task in a new repo.

## Common issues

- Repository not initialized: run `atlas-forge init`.
- Validation error: ensure all required add fields are non-empty.
