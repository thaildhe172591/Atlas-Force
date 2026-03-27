# Cursor Integration (MCP-first)

## Quickstart

Configure Cursor MCP:
- `command`: `npx`
- `args`: `-y @thaild12042003/atlas-forge atlas-forge-mcp`

Then run:
1. `af_init`
2. `af_status`
3. `af_search`
4. `af_start_task`
5. `af_add_memory`
6. `af_close_task`

Expected from `af_status`:
- memory snapshot
- promotion mode
- readiness dashboard fields

## Best Skill Stack

- `brainstorming`
- `documentation-templates`
- `verification-before-completion`

## Troubleshooting

| Symptom | Fix |
|---|---|
| No MCP tools | validate Cursor MCP config path and restart host |
| Missing `.atlasforge` | run `af_init` in project root |
| Invalid payloads | ensure required args and valid memory type |
