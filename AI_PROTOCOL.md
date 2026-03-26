# 🤖 Atlas Forge: Global AI Agent Protocol

This document serves as the **Standard Operating Procedure (SOP)** for any AI Agent (Claude, Gemini, Codex, Antigravity) interacting with this codebase.

## 🧠 The "Brain" Philosophy
This project uses **Atlas Forge** as its external long-term memory. AI Agents MUST consult the `.atlasforge/` directory before making major structural changes and MUST record new architectural decisions.

---

## 🛠️ Model-Specific Integration

### 1. Claude (Anthropic / Claude Desktop)
- **Interface**: Model Context Protocol (MCP).
- **Instruction**: Use the `af_search` tool to find context. Use `af_add_memory` to record any `decision` or `module` changes.

### 2. Gemini (Google)
- **Interface**: CLI / File-system access.
- **Instruction**: Read `.atlasforge/canonical/canonical.jsonl` to understand the project history. Run `npx atlas-forge status` to see the current task state.

### 3. Antigravity (Google DeepMind)
- **Interface**: Internal Tools / CLI.
- **Instruction**: You are the primary orchestrator. Always wrap significant edits with `atlas-forge start` and `atlas-forge close`. Ensure all `implementation_plan.md` decisions are captured via `atlas-forge add`.

### 4. Codex / GitHub Copilot
- **Interface**: Context Window / System Prompts.
- **Instruction**: Reference `@.atlasforge` in your chat context to ensure alignment with established patterns.

---

## 📋 Agent Checklist

Before any implementation:
- [ ] Check `af_search` for related patterns or previous failed attempts.
- [ ] Ensure an active session exists (`af_status`).

After any implementation:
- [ ] Capture key decisions (`af_add_memory --type decision`).
- [ ] Record new module patterns (`af_add_memory --type module`).
- [ ] Run diagnostics before closing (`af_close`).

---

*This protocol ensures that regardless of which AI is working on the project, the knowledge remains persistent and unified.*
