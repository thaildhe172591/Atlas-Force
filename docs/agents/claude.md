# Claude Integration (MCP-first)

## Quickstart

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

Then run:

1. `af_init`
2. `af_status`
3. `af_search`
4. `af_start_task`
5. `af_add_memory`
6. `af_close_task`

## One-Screen Flow

- Start with `af_init` in a fresh workspace.
- Use `af_status` to confirm readiness and current memory counts.
- Capture key decisions with `af_add_memory` while coding.
- Close with `af_close_task` once the task is done.

## Troubleshooting

- Workspace not initialized: call `af_init` first.
- Missing tools: verify the MCP host is loading `atlas-forge-mcp`.
- Invalid `type`: use the supported memory types in `README.md`.
