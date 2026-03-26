# Agent Support Matrix

| Agent | Primary Interface | Setup Time | Supported Flows | Maturity | Known Limitations |
|---|---|---|---|---|---|
| Claude | MCP | 5-10 min | init, start, add, search, close, status | High | Depends on MCP host compatibility |
| Cursor | MCP | 5-10 min | init, start, add, search, close, status | High | Same MCP payload constraints as Claude |
| Codex | CLI + `.atlasforge` | 2-5 min | status, search, start, add, doctor, close | High | Requires `--json` discipline for automation |
| Gemini | CLI | 2-5 min | status, search, start, add, doctor, close | High | No native MCP path in this repo |
| Antigravity | CLI | 2-5 min | status, search, start, add, doctor, close | High | No native MCP path in this repo |
