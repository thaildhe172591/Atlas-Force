# Antigravity Integration (CLI-first)

## Goal

Use Atlas Forge as an execution memory ledger for orchestrated multi-step tasks.

## Workflow checklist

1. `atlas-forge status --json`
2. `atlas-forge search "<query>" --json`
3. `atlas-forge start "<task summary>" --json`
4. Capture milestones with `atlas-forge add ... --json`
5. `atlas-forge doctor --json`
6. `atlas-forge close "<outcome summary>" --json`

## Discipline rules

- No task is considered complete until `close` succeeds.
- Run `doctor` before `close` on long-running tasks.
- Store rationale, not only implementation details.

## Verify

- `atlas-forge verify --json` should be green before orchestration begins.

## Common issues

- Invalid staged entries: inspect `doctor.checks` and repair.
- No active session: rerun `start` before `add` or `close`.
