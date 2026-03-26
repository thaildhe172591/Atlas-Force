# Antigravity Integration (CLI-first)

## Quickstart

1. `atlas-forge init --agent auto --json`
2. `atlas-forge verify --json`
3. `atlas-forge status --json`
4. `atlas-forge search "<query>" --json`
5. `atlas-forge start "<task summary>" --json`
6. `atlas-forge doctor --json`
7. `atlas-forge close "<outcome summary>" --json`

## Best Skill Stack

- `brainstorming` for task framing before implementation starts.
- `workflow-plan` for stepwise orchestration of larger work.
- `verification-before-completion` before closing long-running tasks.

## One-Screen Flow

- Use `doctor` before `close` on long-running tasks.
- Capture milestones with `add --json` during implementation.
- Treat `close` as the only completion gate.

## Troubleshooting

- Invalid staged entries: inspect `doctor.checks` and repair.
- No active session: rerun `start` before `add` or `close`.
- Readiness issues: rerun `verify --json` and clear the gaps first.
