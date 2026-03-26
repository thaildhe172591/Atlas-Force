# Cursor Integration (MCP-first)

## Goal

Use Atlas Forge MCP tools directly in Cursor workflows.

## Setup

Configure MCP to run:

- command: `npx`
- args: `-y @thaild12042003/atlas-forge atlas-forge-mcp`

## Workflow

1. Run `af_status` before implementation.
2. Query context using `af_search`.
3. Open a session with `af_start_task`.
4. Record important decisions via `af_add_memory`.
5. Finalize using `af_close_task`.

## Verify

- Confirm tool list includes all six Atlas Forge tools.
- Run `af_status` and verify snapshot fields are returned.

## Common issues

- Missing `.atlasforge`: run `af_init`.
- Invalid MCP payloads: ensure required fields are present and typed correctly.
