# 🤖 Atlas Forge: Universal AI Agent Protocol (v0.2.2)

This document defines the **Standard Operating Procedure (SOP)** for any AI Agent (Claude, Gemini, Cursor, Antigravity) interacting with this codebase. Compliance is MANDATORY to maintain project cohesion.

---

## 🧠 The "Titan Brain" Philosophy
Atlas Forge is NOT just a log; it is the **Single Source of Truth** for architectural rationale. 
- **Agents MUST NOT** make significant design changes without consulting `af_search`.
- **Agents MUST** record the *rationale* (the "Why") behind every implementation.

---

## 🛠️ Model-Specific Directives

### 1. Claude (Anthropic / Cursor / IDEs)
- **Interface**: Model Context Protocol (MCP).
- **Tooling**: Use `af_search` for context and `af_add_memory` for every major code change.
- **Goal**: Maintain 100% parity between code state and knowledge store.

### 2. Gemini & Antigravity (Google)
- **Interface**: Direct File Access / CLI.
- **Instruction**: Read `.atlasforge/canonical/canonical.jsonl` at session start.
- **Goal**: Serve as the "Forge Master" ensuring all staging memories are promoted correctly via `af_close_task`.

### 3. Codex / GitHub Copilot
- **Instruction**: Use the `@.atlasforge` reference to ground suggestions in the project's established memory.

---

## 📋 Standard Workflow Checklist

### Phase A: Discovery (MANDATORY)
- [ ] Call `af_search` with keywords about the task.
- [ ] Call `af_status` to check for active sessions or pending staging memories.

### Phase B: Implementation (AUTO)
- [ ] If a design choice is made (e.g., opting for a specific library or pattern), call `af_add_memory --type decision`.
- [ ] If a new directory structure is created, call `af_add_memory --type module`.

### Phase C: Finalization (MANDATORY)
- [ ] Call `af_close_task` with a comprehensive summary of accomplishments.
- [ ] Verify that the "Doctor" diagnostics pass.

---

## 🏷️ Memory Type Standard
| Type | Use Case |
|------|----------|
| `decision` | Rationale for logic, libraries, or architecture. |
| `module` | Description of a component's responsibility. |
| `bugfix` | Root cause analysis and prevention strategy. |
| `code-pattern` | Template logic for future reuse. |

---

*Atlas Forge ensures that knowledge outlives the Chat Session. Forge well.*
