# Antigravity Integration (CLI orchestration)

## Quickstart

```bash
npx atlas-forge init --agent auto --json
npx atlas-forge verify --json
npx atlas-forge status --json
npx atlas-forge search "<query>" --json
npx atlas-forge start "<task summary>" --json
npx atlas-forge doctor --json
npx atlas-forge close "<outcome summary>" --json
```

Expected result:
- orchestration flow uses the same readiness and promotion contracts
- `runtime_readiness_dashboard` is present in `verify/status`

## Best Skill Stack

- `brainstorming`
- `workflow-plan`
- `verification-before-completion`

## Troubleshooting

| Symptom | Fix |
|---|---|
| No active session on close | run `start` first |
| Doctor warnings/fails | inspect `doctor.checks` and resolve before close |
| Readiness mismatch | run `verify --json`, then optimize missing artifacts |
