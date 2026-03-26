# Atlas Forge

Local-first memory orchestration for AI agents working in real codebases.

[![NPM Version](https://img.shields.io/npm/v/@thaild12042003/atlas-forge.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/@thaild12042003/atlas-forge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20-green.svg?style=flat-square)](https://nodejs.org)

## Why Atlas Forge

Atlas Forge gives AI agents a persistent, inspectable memory layer inside your repository.

- Local data in `.atlasforge/`
- JSONL storage for transparency
- Structured lifecycle: `start -> add -> doctor -> close`
- Dual interface: CLI and MCP

## Install

```bash
npm install @thaild12042003/atlas-forge
```

## 60-second Quick Start

```bash
npx atlas-forge init
npx atlas-forge start "Refactor auth module"
npx atlas-forge add --type decision --title "JWT over session" --summary "Stateless scaling requirement"
npx atlas-forge doctor
npx atlas-forge close "Refactor complete"
npx atlas-forge status
```

## CLI Surface

All commands support `--json` for machine-readable automation.

| Command | Purpose |
|---|---|
| `atlas-forge init` | Initialize `.atlasforge` structure |
| `atlas-forge start <summary>` | Start a task session |
| `atlas-forge add --title --summary [--type]` | Add memory to staging |
| `atlas-forge doctor` | Run diagnostics on staged entries |
| `atlas-forge close <summary>` | Close active task and promote |
| `atlas-forge search <query> [--limit]` | Search canonical memory |
| `atlas-forge status` | Show snapshot counts + active session |
| `atlas-forge verify` | Verify workspace readiness |

### Supported Memory Types

`onboarding`, `architecture`, `module`, `decision`, `bugfix`, `incident`, `task-note`, `policy`, `convention`, `code-pattern`

## MCP Setup (Claude Desktop / Cursor)

Use the published npm package:

```json
{
  "mcpServers": {
    "atlas-forge": {
      "command": "npx",
      "args": ["-y", "@thaild12042003/atlas-forge", "atlas-forge-mcp"]
    }
  }
}
```

Alternative (if your MCP host supports direct binary execution):

```json
{
  "mcpServers": {
    "atlas-forge": {
      "command": "atlas-forge-mcp",
      "args": []
    }
  }
}
```

### MCP Verification

1. Start MCP host with the config above.
2. Confirm tools are listed:
   `af_init`, `af_start_task`, `af_add_memory`, `af_search`, `af_close_task`, `af_status`.
3. Run `af_init` then `af_status` in a test workspace.

## Guides

- AI protocol: [AI_PROTOCOL.md](https://github.com/thaildhe172591/Atlas-Force/blob/main/AI_PROTOCOL.md)
- Claude: [docs/agents/claude.md](https://github.com/thaildhe172591/Atlas-Force/blob/main/docs/agents/claude.md)
- Cursor: [docs/agents/cursor.md](https://github.com/thaildhe172591/Atlas-Force/blob/main/docs/agents/cursor.md)
- Codex: [docs/agents/codex.md](https://github.com/thaildhe172591/Atlas-Force/blob/main/docs/agents/codex.md)
- Gemini: [docs/agents/gemini.md](https://github.com/thaildhe172591/Atlas-Force/blob/main/docs/agents/gemini.md)
- Antigravity: [docs/agents/antigravity.md](https://github.com/thaildhe172591/Atlas-Force/blob/main/docs/agents/antigravity.md)
- Agent support matrix: [docs/agents/support-matrix.md](https://github.com/thaildhe172591/Atlas-Force/blob/main/docs/agents/support-matrix.md)
- Release checklist: [docs/release-checklist.md](https://github.com/thaildhe172591/Atlas-Force/blob/main/docs/release-checklist.md)
- Changelog: [CHANGELOG.md](https://github.com/thaildhe172591/Atlas-Force/blob/main/CHANGELOG.md)

## License

MIT © 2026 thaild12042003
