# Gemini Integration (CLI-first)

## Quickstart

```bash
npx atlas-forge init --agent gemini --json
npx atlas-forge verify --agent gemini --json
npx atlas-forge status --agent gemini --json
npx atlas-forge search "<query>" --json
npx atlas-forge start "<task summary>" --json
npx atlas-forge add --type decision --title "<title>" --summary "<summary>" --json
npx atlas-forge doctor --json
npx atlas-forge close "<outcome summary>" --json
```

Expected readiness keys:
- `selected_runtime`
- `selected_runtime_ready`
- `professional_kit_ready`
- `runtime_readiness_dashboard`

## Best Skill Stack

- `writing-plans`
- `clean-code`
- `verification-before-completion`

## Troubleshooting

| Symptom | Fix |
|---|---|
| Validation error on add | ensure required fields are non-empty and type is supported |
| `professional_kit_ready=false` | run `npx atlas-forge optimize --agent all --json` then verify again |
| Readiness score low | inspect `gaps[]` from `verify --json` and clear missing artifacts |

## Prompt Seed

```text
Use Atlas Forge CLI-first.
Start with verify and status in JSON mode.
Keep changes minimal, capture key decisions, run doctor, then close.
```
