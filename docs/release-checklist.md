# Release Checklist (npm + GitHub Packages)

This checklist is the final gate before publishing Atlas Forge.

## 1) Semantic Version

- Patch (`x.y.Z`): bug fixes, docs, compatibility hardening.
- Minor (`x.Y.z`): backward-compatible features.
- Major (`X.y.z`): breaking API/contract changes.

Current release target: `0.4.4` (patch).

## 2) Required Pre-Release Commands

Run from repository root:

```bash
npm run lint
npm test
npm run test:smoke
npm run build
npm_config_cache=/tmp/.npm npm pack --dry-run
```

Expected:
- all commands exit `0`
- dry-run tarball contains `dist`, `README.md`, `LICENSE`, `CHANGELOG.md`

## 3) MCP & CLI Contract Gate

- MCP tools listed and stable:
  - `af_init`, `af_start_task`, `af_add_memory`, `af_search`, `af_close_task`, `af_status`
- CLI commands documented and available:
  - `init`, `start`, `add`, `doctor`, `close`, `search`, `status`, `verify`
- `memory_type` enum synchronized across:
  - core model
  - zod schema
  - MCP input schema
  - docs

## 4) Version, Tag, and Publish Flow

```bash
npm whoami
npm version patch
git push origin main --follow-tags
```

What happens next:
- the git tag pushed by `npm version` triggers GitHub Actions
- the workflow runs `lint`, `test`, `test:smoke`, and `build`
- if green, it publishes:
  - npmjs: `@thaild12042003/atlas-forge`
  - GitHub Packages: `@thaildhe172591/atlas-forge`
- it then creates or updates the GitHub Release for that tag

Manual fallback:

```bash
npm publish --access public
```

Post-publish quick verification:

```bash
npm view @thaild12042003/atlas-forge version
npx -y @thaild12042003/atlas-forge atlas-forge verify --json
```
