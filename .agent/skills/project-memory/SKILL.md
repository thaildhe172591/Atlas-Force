---
name: project-memory
description: Universal Local Project Memory System. Read this skill to understand how to store and retrieve project context and lessons safely without external dependencies.
---

# `project-memory` Skill

## 🎯 Purpose
Provide AI Agents with context about the current project (tech stack, rules, active tasks) purely through local Markdown files.

## 📁 Memory Data Location
ALL project memory is stored securely in:
`.agent/memory/`

## 🧠 Core Memory Files
1. **`project_identity.md`**: Durable Knowledge. (Tech Stack, App Architecture, Global styling, Security rules).
2. **`agent_lessons.md`**: Evolving Rules. (Coding conventions, known gotchas, fixed bugs).
3. **`active_context.md`**: Working Memory. (Current sprint focus, recently completed tasks, next steps).

## 🛠️ Operating Rules
- **Before major changes**: Always read all 3 files in `.agent/memory/` to load project context.
- **After task completion**: If you solved a novel bug or made an architectural decision, append a concise summary to `agent_lessons.md` or `project_identity.md`.
- **End of Session**: ALWAYS update `active_context.md` with the new state of the project so the next Agent knows where to pick up.
- **No Mem0 CLI**: Do NOT attempt to run `memory-cli.mjs` or use external Ollama for project memory. All project memory in this repository is purely Markdown-based.
