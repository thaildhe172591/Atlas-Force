# Atlas Forge: Universal AI Agent Protocol (v0.3.0)

This protocol defines how Claude, Cursor, Codex, Gemini, and Antigravity should work with Atlas Forge.

## Core rules

- Treat `.atlasforge/` as the project memory source of truth.
- Always search existing memory before large changes.
- Always close the task with a summary when implementation is done.
- Prefer machine-readable output (`--json`) for automation.

## Standard command workflow (CLI-first)

```bash
atlas-forge status --json
atlas-forge search "<query>" --json
atlas-forge start "<task summary>" --json
atlas-forge add --type decision --title "<title>" --summary "<summary>" --json
atlas-forge doctor --json
atlas-forge close "<outcome summary>" --json
```

## MCP workflow (Claude/Cursor)

Required tools:
- `af_init`
- `af_start_task`
- `af_add_memory`
- `af_search`
- `af_close_task`
- `af_status`

Recommended sequence:
1. `af_status`
2. `af_search`
3. `af_start_task`
4. `af_add_memory` during implementation milestones
5. `af_close_task` on completion

## Supported memory types

- `onboarding`
- `architecture`
- `module`
- `decision`
- `bugfix`
- `incident`
- `task-note`
- `policy`
- `convention`
- `code-pattern`

## Agent-specific guides

- Claude: `docs/agents/claude.md`
- Cursor: `docs/agents/cursor.md`
- Codex: `docs/agents/codex.md`
- Gemini: `docs/agents/gemini.md`
- Antigravity: `docs/agents/antigravity.md`
