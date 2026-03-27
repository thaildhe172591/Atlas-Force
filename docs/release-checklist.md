# Release Checklist (npmjs + GitHub Packages)

Final gate before publishing Atlas Forge.

## 1) Version Target

- Patch (`x.y.Z`): fixes/docs/compat hardening.
- Minor (`x.Y.z`): backward-compatible features.
- Major (`X.y.z`): breaking contracts.

Current target: `0.4.7` (patch).

## 2) Mandatory Pre-Tag Gate

Run from repo root:

```bash
npm run lint
npm test
npm run test:smoke
npm run build
npm_config_cache=/tmp/.npm npm pack --dry-run
```

Pass conditions:
- all commands exit `0`
- tarball contains `dist`, `README.md`, `LICENSE`, `CHANGELOG.md`
- tarball includes curated vendor path `vendor/superpowers-curated`

## 3) Contract and Docs Consistency Gate

- CLI/MCP docs match actual command names.
- JSON docs mention readiness keys:
  - `profile`
  - `selected_runtime`
  - `selected_runtime_ready`
  - `professional_kit_ready`
  - `runtimes`
  - `runtime_readiness_dashboard`
- `docs/agents/*`, `README.md`, and `TUTORIAL.md` use consistent examples.

## 4) Package Metadata Gate (Both Registries)

Check npmjs manifest:

```bash
npm pkg get name version files
```

Expected:
- `name`: `@thaild12042003/atlas-forge`
- `version`: `0.4.7`
- `files` includes `vendor/superpowers-curated`

Check GitHub package prep script path:
- workflow runs `node scripts/prepare-github-package.mjs`
- generated package name is `@thaildhe172591/atlas-forge`

## 5) Publish Flow (Tag-driven)

```bash
npm whoami
npm version patch
git push origin main --follow-tags
```

Tag push triggers `Publish Release Packages` workflow:
- npmjs publish
- GitHub Packages publish
- GitHub Release creation/update

## 6) Auth / 2FA / Scope Failure Order

Handle failures in this order:
1. `ENEEDAUTH`:
   - ensure repo secret `NPM_TOKEN` exists
   - ensure workflow uses `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` for npmjs step
2. `EOTP`:
   - recreate npm token with automation-friendly 2FA bypass
3. npmjs `E404` for scoped package:
   - use token from owner account of `@thaild12042003` scope
4. GitHub Packages missing:
   - verify `packages: write` permission and tagged workflow success

## 7) Post-Publish Verification

```bash
npm view @thaild12042003/atlas-forge version
npx -y @thaild12042003/atlas-forge atlas-forge verify --json
```

Manual checks:
- GitHub Release exists for `v0.4.7`
- GitHub Packages tab shows `@thaildhe172591/atlas-forge`
