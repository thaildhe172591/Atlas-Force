# 📚 Atlas Forge Tutorial: Master Your Agent's Memory

This guide will help you understand the core concepts of knowledge orchestration and how to use Atlas Forge to build a "Titan Brain" for your project.

---

## 🧠 Core Concepts

### 1. The Dual-Store System
Atlas Forge manages knowledge in two stages:
- **Staging Area**: Where "active" memories live during a task. They are drafts, potentially incomplete or unverified.
- **Canonical Store**: The "Gold Standard" of knowledge. Only verified, high-quality memories are promoted here.

### 2. The Task Session Lifecycle
A `TaskSession` is a bounded context for work.
1. **`start`**: Defines what you *intend* to do. It pre-fetches related memories to give you context.
2. **`add`**: Captures knowledge *during* the work. 
3. **`close`**: Synthesizes the result, runs the **Doctor** (diagnostics), and promotes staging entries to the Canonical Store.

---

## 🛠️ Best Practices

### When to use `add`?
Don't record every line of code. Record:
- **Decisions**: Why did you choose Library A over Library B?
- **Patterns**: How should a developer implement a new API endpoint in *this* project?
- **Gotchas**: What caused a bug that took 2 hours to fix? (Prevent the AI from repeating it).
- **Module Roles**: What is the specific responsibility of a new directory?

### Memory Types Reference
| Type | Use Case |
|------|----------|
| `decision` | ADRs (Architecture Decision Records) |
| `module` | Describing new packages or directories |
| `code-pattern` | Reusable logic templates |
| `task-note` | General observations during a session |

---

## 🧪 Advanced Workflows

### Auto-Capture with AI
If you are using the MCP server, you don't need to manually run `add`. You can simply tell your agent:
> "Hey, I just implemented the database migration logic. Please add a decision entry to Atlas Forge explaining why we used a separate schema for audit logs."

The Agent will call `af_add_memory` with the correct technical details automatically.

### Searching for Context
Use `af_search` to find "why" something was done.
```bash
npx atlas-forge search "audit logs"
```
Instead of grep-ing through code, you get the **rationale** behind it.

---

## 🚑 Troubleshooting

- **Doctor Failed**: If `close` fails, check the `warn` or `fail` messages. Usually, it's a missing mandatory field or a schema mismatch.
- **Stale Memories**: If a memory matches an old version of the code, use `npx atlas-forge status` to identify potential stale entries (Feature coming in v0.3.0).

---

Happy Forging! ⚒️🚀
