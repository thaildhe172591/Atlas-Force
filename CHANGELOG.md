# Changelog
 
All notable changes to this project are documented in this file.

## 0.4.6 - 2026-03-27

### Added
- Runtime readiness dashboard contract is now documented consistently across README, tutorial, and agent guides:
  - `profile`
  - `selected_runtime`
  - `selected_runtime_ready`
  - `professional_kit_ready`
  - `runtimes`
  - `runtime_readiness_dashboard`
- Visual Quickstart + Troubleshooting format for user-facing docs, including one-page flow and quick decision tables.

### Changed
- Curated Superpowers vendor subset is now the documented release baseline for professional profile packaging.
- Release checklist is hardened for dual-registry publish with explicit metadata gate and ordered auth/2FA/scope troubleshooting.

## 0.4.5 - 2026-03-27

### Added
- Stronger release and onboarding guidance for the agent entry layer v1.
- Explicit docs for `init --agent all`, generated entry-layer artifacts, and readiness metadata.
- Install and release guidance for the dual-package publish model:
  - npmjs: `@thaild12042003/atlas-forge`
  - GitHub Packages: `@thaildhe172591/atlas-forge`

### Changed
- README and tutorial now highlight the 0.4.5 workflow and troubleshooting path for registry publishing.

## 0.4.4 - 2026-03-27

### Changed
- Split release packaging so npmjs and GitHub Packages publish under different scoped names.
- GitHub Packages now publishes from a generated manifest as `@thaildhe172591/atlas-forge`.
- npmjs continues publishing as `@thaild12042003/atlas-forge`.

## 0.4.3 - 2026-03-27

### Changed
- Added a tag-driven release workflow so `npm version` + `git push --follow-tags` can publish to npmjs and GitHub Packages automatically.
- Added automatic GitHub Release creation after successful package publication.
- Synchronized package, CLI, MCP, and managed artifact versions to `0.4.3`.

## 0.4.2 - 2026-03-27
 
### Added
- **Adaptive Agent Bootstrapping**: Automatic injection of profile-specific guidance (GEMINI.md, CLAUDE.md, etc.) and skills/workflows on `init`.
- **Agent Readiness Score**: Real-time evaluation of workspace health and agent integration (0-10 scale).
- **Promotion Mode Migration**: Seamless migration from legacy `assisted` mode to the new default `direct` mode.
- **Optimize Command**: New CLI command to re-sync agent-ready artifacts without overwriting user changes.
- **Enhanced Status/Verify**: Multi-dimensional health reporting including agent profiles and readiness gaps.
 
### Changed
- Major architectural hardening to support adaptive artifact management.
- Standardized `promote_mode` to `direct` for new workspaces.
- Upgraded Node.js requirement to `>=20`.
- Synchronized CLI, MCP, and Core versions to `0.4.0`.
 
## 0.3.8 - 2026-03-27
 
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
