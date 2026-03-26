# Changelog
 
All notable changes to this project are documented in this file.

## 0.3.6 - 2026-03-27

### Changed
- Documentation: added flow diagrams, quick reference tables, and shorter agent guides for faster onboarding.
- Release metadata: synchronized package, CLI, MCP, and lockfile versions for publish readiness.

### Added
- Adaptive agent bootstrap guidance for Claude, Gemini, and Codex.
 
## 0.3.2 - 2026-03-27
 
### Added
- CLI: Global `--cwd <path>` flag to control working directory independently of `process.cwd()`.
 
### Fixed
- CI: Resolved parallel test flakiness by using `--cwd` for smoke tests instead of `process.chdir()`.
- Windows: Improved `scripts/run-vitest.mjs` to handle project paths with spaces and inherited environment variables.
- Node.js 18.x: Better compatibility for test runner using `spawnSync`.
- CLI/MCP: Synchronized internal versioning to `0.3.2`.
 
## 0.3.1 - 2026-03-27

### Added
- Cross-platform test runner wrapper at `scripts/run-vitest.mjs`.
- Release-oriented docs:
  - `docs/release-checklist.md`
  - enhanced `README.md` and `TUTORIAL.md`.

### Changed
- Improved OSS release flow:
  - `prepublishOnly` now runs `lint`, `test`, `test:smoke`, then `build`.
- Version alignment updated to `0.3.1` for package, CLI, and MCP server.
- npm package now includes `CHANGELOG.md` in published files.

### Notes
- Recommended publish command:
  - `npm publish --access public`
