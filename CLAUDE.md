# CLAUDE.md - Atlas Forge MCP Workflow

Use Atlas Forge via MCP-first workflow for Claude.

## Required sequence
1. `af_status`
2. `af_search`
3. `af_start_task`
4. `af_add_memory` during milestones
5. `af_close_task`

## Rules
- Keep payloads structured and concise.
- Capture decisions and reusable patterns as memories.
- Always close the task with an explicit outcome summary.
