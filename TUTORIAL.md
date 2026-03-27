# Atlas Forge Tutorial (Quickstart + Troubleshooting)

This guide is optimized for fast onboarding and production-safe usage.

## 0.4.6 Highlights

- EN: Curated professional vendor kit for smaller, cleaner release payloads.
- VN: Bộ professional kit đã được curate có chủ đích, giúp package gọn và ổn định hơn.
- EN: Runtime readiness now has a short dashboard shape in `verify/status --json`.
- VN: Readiness theo runtime có dashboard JSON ngắn để đọc nhanh.
- EN: Legacy migration for old config is stricter and more deterministic.
- VN: Migration config repo cũ đã cứng hơn, giảm lỗi edge-case.

## 1) Quickstart

### Universal flow (CLI JSON-first)

```bash
npx atlas-forge init --agent auto --json
npx atlas-forge verify --json
npx atlas-forge status --json
npx atlas-forge start "Task summary" --json
npx atlas-forge add --type decision --title "Decision" --summary "Why" --json
npx atlas-forge doctor --json
npx atlas-forge close "Task done" --json
```

Expected checkpoints:
- `verify`: `ok=true`, has `runtime_readiness_dashboard`
- `status`: `snapshot` + `promotion` + `runtime_readiness_dashboard`
- `close`: `promoted_count > 0` for valid staged entries

### Mini walkthrough by agent

| Agent | First command | Next command | Expected result |
|---|---|---|---|
| Codex | `npx atlas-forge init --agent codex --json` | `npx atlas-forge status --agent codex --json` | CLI workflow ready + dashboard fields present |
| Claude | `af_init` | `af_status` | MCP tools usable and status payload visible |
| Gemini | `npx atlas-forge init --agent gemini --json` | `npx atlas-forge verify --agent gemini --json` | Profile-specific setup + readiness details |

## 2) Readiness Dashboard Quick Read

Look at these keys:

- `selected_runtime`: runtime currently applied
- `selected_runtime_ready`: pass/fail for selected runtime
- `professional_kit_ready`: pass/fail for full multi-runtime kit
- `runtime_readiness_dashboard.summary`: total and not-ready runtimes

Sample:

```json
{
  "selected_runtime": "codex",
  "selected_runtime_ready": true,
  "professional_kit_ready": true,
  "runtime_readiness_dashboard": {
    "summary": { "ready_count": 3, "total": 3, "not_ready": [] }
  }
}
```

## 3) Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Atlas Forge is not initialized` | missing `.atlasforge` | run `init --agent auto --json` |
| `selected_runtime_ready=false` | missing/drifted runtime artifacts | run `optimize --agent <runtime> --json`, then `verify --json` |
| `professional_kit_ready=false` | all-runtime kit incomplete in professional mode | run `optimize --agent all --json` |
| `doctor` fail | invalid staged entries or proof requirements | inspect `doctor.checks`, fix entries, rerun |
| `close` not promoting expected entries | skipped/failing staged entries | rerun `doctor`, then close again |

## 4) Publish Checklist (Fast Path)

```bash
npm run lint
npm test
npm run test:smoke
npm run build
npm_config_cache=/tmp/.npm npm pack --dry-run
npm version patch
git push origin main --follow-tags
```

The tag triggers dual publish:
- npmjs: `@thaild12042003/atlas-forge`
- GitHub Packages: `@thaildhe172591/atlas-forge`

## 5) Post-publish Verification

```bash
npm view @thaild12042003/atlas-forge version
npx -y @thaild12042003/atlas-forge atlas-forge verify --json
```

Manual checks:
- GitHub Release exists for tag `vX.Y.Z`
- GitHub Packages tab shows `@thaildhe172591/atlas-forge`
- `verify --json` output contains readiness dashboard keys
