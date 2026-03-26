# Claude Integration (MCP-first)

## Goal

Use Atlas Forge as persistent project memory from Claude via MCP.

## Setup

Add to `claude_desktop_config.json`:

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

## Workflow

1. `af_status`
2. `af_search`
3. `af_start_task`
4. `af_add_memory` on key decisions
5. `af_close_task`

## Verify

- Ensure tools are listed by the MCP host.
- Run `af_init` and then `af_status` in a test workspace.

## Common issues

- Workspace not initialized: call `af_init` first.
- Invalid `type` in `af_add_memory`: use supported memory types from `README.md`.
