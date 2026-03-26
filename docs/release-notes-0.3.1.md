# Atlas Forge v0.3.1 (Draft Release Notes)

## Highlights

- Hardened npm release flow with explicit prepublish gates:
  - lint
  - full tests
  - smoke tests
  - build
- Improved OSS documentation quality:
  - cleaner, more visual `README`
  - clearer onboarding `TUTORIAL`
  - release checklist and changelog
- Stabilized agent integration contracts:
  - CLI JSON-first workflow (`doctor`, `verify`)
  - MCP schema/validation alignment
  - contract + smoke tests for CLI and MCP

## Why this release matters

This release focuses on publish-readiness and operational reliability so teams can install and use Atlas Forge with fewer integration surprises across agent workflows.

## Upgrade

```bash
npm install @thaild12042003/atlas-forge@0.3.1
```
