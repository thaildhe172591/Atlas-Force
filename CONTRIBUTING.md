# Contributing to Atlas Forge ⚒️

Thank you for your interest in contributing to Atlas Forge! We are building a high-performance local memory layer for the next generation of AI agents.

## 🛠️ Development Setup

1. **Clone the repo**:
   ```bash
   git clone https://github.com/thaildhe172591/Atlas-Force.git
   cd Atlas-Force
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Run tests**:
   ```bash
   npm test
   ```

## 📜 Coding Standards

- **TypeScript**: Use strict typing. Avoid `any` except in rare cases (MCP wrappers).
- **Clean Code**: Follow the `@[skills/clean-code]` principles. Concise, direct, and well-named.
- **Sync for Speed**: Atlas Forge uses synchronous I/O for core engine logic to ensure reliability in agentic environments.

## 🚀 Pull Request Process

1. Create a branch for your feature or fix.
2. Ensure `npm run lint` passes.
3. Ensure `npm test` passes (100% success required).
4. Update `package.json` version if it's a major/minor/patch change.
5. Push to your fork and submit a PR!

## 📄 License

By contributing, you agree that your contributions will be licensed under the **MIT License**.
