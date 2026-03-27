# Codex Integration (CLI-first)

## Quickstart

```bash
npx atlas-forge init --agent codex --json
npx atlas-forge verify --agent codex --json
npx atlas-forge status --agent codex --json
npx atlas-forge search "<query>" --json
npx atlas-forge start "<task summary>" --json
npx atlas-forge add --type code-pattern --title "<title>" --summary "<summary>" --json
npx atlas-forge doctor --json
npx atlas-forge close "<outcome summary>" --json
```

Expected keys in `status/verify --json`:
- `selected_runtime`
- `selected_runtime_ready`
- `professional_kit_ready`
- `runtime_readiness_dashboard`

## Best Skill Stack

- `systematic-debugging`
- `writing-plans`
- `verification-before-completion`

## Troubleshooting

| Symptom | Fix |
|---|---|
| `selected_runtime_ready=false` | `npx atlas-forge optimize --agent codex --json` then re-run `verify --json` |
| Missing runtime dashboard keys | use latest package and rerun `status --json` |
| Close fails or no promotion | run `doctor --json`, fix checks, then `close --json` |

## Prompt Seed

```text
Use Atlas Forge as the repo memory system.
Flow: status -> search -> start -> implement -> add memories -> doctor -> close.
Prefer --json and do not close until doctor passes.
```
