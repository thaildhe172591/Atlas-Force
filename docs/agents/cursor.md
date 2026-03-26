# Cursor Integration (MCP-first)

## Quickstart

Configure MCP to run:

- `command`: `npx`
- `args`: `-y @thaild12042003/atlas-forge atlas-forge-mcp`

Then use:

1. `af_init`
2. `af_status`
3. `af_search`
4. `af_start_task`
5. `af_add_memory`
6. `af_close_task`

## Best Skill Stack

- `brainstorming` for layout, workflow, or feature decisions.
- `documentation-templates` when you need docs that stay scannable in the IDE.
- `verification-before-completion` before you mark a change ready.

## One-Screen Flow

- `af_init` when the workspace is new.
- `af_status` before implementation to see snapshot fields.
- `af_search` to pull context into the IDE.
- `af_add_memory` for important decisions and reusable patterns.

## Troubleshooting

- Missing `.atlasforge`: run `af_init`.
- Invalid MCP payloads: ensure required fields are present and typed correctly.
- No tool list: confirm the Cursor MCP config points to `atlas-forge-mcp`.
