# Agent Support Matrix

| Agent | Primary Interface | Quick Start | Expected Output | Notes |
|---|---|---|---|---|
| Claude | MCP | `af_init` -> `af_status` | Tools available, active session visible | Best for MCP-first workflows |
| Cursor | MCP | `af_init` -> `af_search` | MCP tools in IDE, structured payloads | Same MCP contract as Claude |
| Codex | CLI + `.atlasforge` | `init --agent codex --json` -> `status --json` | JSON-ready repo memory flow | Best for command-line automation |
| Gemini | CLI | `init --agent gemini --json` -> `optimize --agent gemini --json` | Profile-specific guidance + readiness score | CLI-first, deterministic workflow |
| Antigravity | CLI | `init --agent auto --json` -> `doctor --json` -> `close` | Promotion discipline with diagnostics | Orchestrated multi-step tasks |
