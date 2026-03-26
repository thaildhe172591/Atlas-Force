# Gemini Integration (CLI-first)

## Quickstart

```bash
atlas-forge init --agent gemini --json
atlas-forge status --json
atlas-forge search "<query>" --json
atlas-forge start "<task summary>" --json
atlas-forge add --type decision --title "<title>" --summary "<summary>" --json
atlas-forge doctor --json
atlas-forge close "<outcome summary>" --json
```

## Best Skill Stack

- `writing-plans` for feature work that needs clear structure first.
- `clean-code` when you want the smallest maintainable change.
- `verification-before-completion` before finalizing or publishing.

## One-Screen Flow

- Use `decision` for architecture tradeoffs.
- Use `module` for component responsibility updates.
- Use `code-pattern` for reusable implementation templates.
- Run `atlas-forge optimize --agent gemini --json` when you want to re-sync guidance files.

## Troubleshooting

- Repository not initialized: run `atlas-forge init --agent gemini --json`.
- Validation error: ensure all required add fields are non-empty.
- Readiness feels low: run `atlas-forge verify --agent gemini --json` and fix the reported gaps.
