# Changelog

All notable changes to this project are documented in this file.

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
