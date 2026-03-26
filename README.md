# ⚒️ Atlas Forge

**Local-first project memory operating layer for coding agents.**

Atlas Forge is a lightweight, high-performance engine designed to give AI agents a persistent, structured memory of your codebase. Unlike generic vector DBs, Atlas Forge focuses on **human-readable, local-first JSONL storage** that lives inside your project in the `.atlasforge/` directory.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/atlas-forge.svg)](https://www.npmjs.com/package/atlas-forge)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-blue.svg)](https://nodejs.org)

---

## 🚀 Why Atlas Forge?

- **Zero-Latency**: Local JSONL storage means 0ms network overhead.
- **Agent-First**: Designed specifically for the "Cortex" memory pattern (Init -> Start -> Add -> Close).
- **Human Readable**: You can open `.atlasforge/canonical/canonical.jsonl` and read exactly what the AI remember.
- **Atomic Operations**: Synchronous I/O ensures consistency even during rapid agent iterations.
- **Searchable**: Built-in lexical search and similarity scoring without external dependencies.

---

## 📦 Installation

```bash
npm install atlas-forge
```

Or run via NPX:

```bash
npx atlas-forge --help
```

---

## 🛠️ Usage

### CLI

Initialize Atlas Forge in your project:
```bash
atlas-forge init
```

Start a new task:
```bash
atlas-forge task start --summary "Implement new auth flow"
```

Add a memory:
```bash
atlas-forge add --type decision --title "Used JWT" --summary "Decided to use JWT for stateless auth"
```

Close the task (Verifies and promotes memory):
```bash
atlas-forge task close --summary "Auth flow completed"
```

### Programmatic API

```typescript
import { AtlasForge } from 'atlas-forge';

const forge = await AtlasForge.init(process.cwd());

// Start task
await forge.taskStart({ summary: 'Refactor engine' });

// Add manual memory
await forge.add({
  memory_type: 'module',
  title: 'Orchestrator',
  summary: 'Refactored task closure logic',
  what_changed: 'src/core/orchestrator/task-close.ts',
  why_it_matters: 'Ensures session safety'
});

// Close and promote
const result = await forge.taskClose({ summary: 'Refactoring complete' });
console.log(`Promoted ${result.promoted_entries.length} memories.`);
```

---

## 🏗️ Architecture

Atlas Forge maintains two primary stores:
1. **Staging Store**: Temporarily holds "draft" or "verified" memories during an active task.
2. **Canonical Store**: The project's "Gold Standard" memory. Entries are promoted here after validation (Doctor) and task closure.

All data is stored in `.atlasforge/`:
- `staging/`: JSONL drafts.
- `canonical/`: Permanent memory.
- `sessions/`: Task lifecycle history.
- `config.yaml`: Engine behavior settings.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © 2026 Atlas Forge Contributors
