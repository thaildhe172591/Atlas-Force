---
description: Manages project-specific knowledge, lessons learned, and context survival across sessions using local Markdown files.
---

# /memory

Manage long-term project memory, lessons learned, and active context.

## 🧠 The Local Memory System

This workspace uses a self-contained, portable Markdown-based memory system located at `.agent/memory/`. By keeping memory inside the repository, any agent or developer can instantly understand the project's state, rules, and identity.

## 📂 Core Files

1. **`project_identity.md`**: Durable knowledge (Stack, Architecture, Visual Identity, Security Boundaries). Contains the **Mermaid Memory Map** representing the core architecture.
2. **`agent_lessons.md`**: Coding conventions, gotchas, anti-patterns. Use **Deep-Linked** context here (always include the absolute file path when referencing a rule or learned lesson).
3. **`active_context.md`**: The working memory. Tracks the current sprint, recently completed tasks, and what the immediate next steps are. Used for **Checkpoint Defense**: before modifying core files, you must check their status here.

## 🔧 Workflow Commands

When the user asks to manage memory, perform the following actions by using your file-editing tools directly on `.agent/memory/`:

- `/memory read`: Read all 3 files to gain full context of the project. This should be the first step an Agent does if they are unsure of the project stack or rules.
- `/memory learn <lesson>`: Append a new lesson, coding convention, or anti-pattern to `.agent/memory/agent_lessons.md`. MUST include an absolute file path as a reference (Deep-Linking).
- `/memory sync <status>`: Update `.agent/memory/active_context.md` with the latest task progress or current focus. 
- `/memory arch <info>`: Update `.agent/memory/project_identity.md` with new architectural decisions, stack updates, or changes to the Mermaid Memory Map.

## ⚠️ Guidelines for AI Agents

- **Proactive Reading**: If you are about to write code for a new feature, ALWAYS read `agent_lessons.md` and `project_identity.md` first to ensure compliance with the project's rules.
- **Atomic Updates**: Keep memory updates concise. Do not dump raw code; instead, distill the *lesson* or *architectural decision*.
- **No External Dependencies**: Do not attempt to run Ollama or external Mem0 CLIs. Only use local Markdown file editing.
