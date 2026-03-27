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

Expected from `af_status`:
- snapshot data
- promotion data
- readiness fields including dashboard

## Best Skill Stack

- `brainstorming`
- `systematic-debugging`
- `verification-before-completion`

## Troubleshooting

| Symptom | Fix |
|---|---|
| Tools not visible | verify MCP host loads `atlas-forge-mcp` |
| Workspace not initialized | call `af_init` first |
| Readiness seems low | run CLI `atlas-forge verify --agent claude --json` and resolve gaps |

## Prompt Seed

```text
Use Atlas Forge through MCP.
Flow: af_init -> af_status -> af_search -> af_start_task -> af_add_memory -> af_close_task.
Keep summaries concise and follow doctor/close discipline.
```
