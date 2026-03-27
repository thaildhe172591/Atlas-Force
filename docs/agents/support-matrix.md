# Agent Support Matrix

## Runtime Matrix (0.4.7)

| Agent | Primary interface | First command | Next command | Expected readiness signal |
|---|---|---|---|---|
| Claude | MCP | `af_init` | `af_status` | `selected_runtime=claude` + dashboard present |
| Cursor | MCP | `af_init` | `af_search` | MCP payload + stable memory flow |
| Codex | CLI | `init --agent codex --json` | `status --agent codex --json` | `selected_runtime_ready=true` and dashboard summary |
| Gemini | CLI | `init --agent gemini --json` | `verify --agent gemini --json` | profile and runtime readiness keys present |
| Antigravity | CLI | `init --agent auto --json` | `doctor --json` | orchestration flow + promotion gate discipline |

## Shared JSON Contract

All supported agents should produce/consume these status fields:

- `profile`
- `selected_runtime`
- `selected_runtime_ready`
- `professional_kit_ready`
- `runtimes`
- `runtime_readiness_dashboard`

## Professional Kit Note

- Professional mode (`--agent all`) uses curated vendor assets (Superpowers subset) for deterministic generation.
- Hooks remain guidance templates and do not participate in readiness pass/fail.
