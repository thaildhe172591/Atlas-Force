---
name: sp-test-driven-development
description: Write the test first, watch it fail, write minimal code to pass (Superpowers version)
when_to_use: when implementing any feature or bugfix, before writing implementation code
version: 3.1.0
---

# Superpowers Test-Driven Development (TDD)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

## The Cycle: Red-Green-Refactor

1. **RED**: Write one minimal failing test showing what should happen.
2. **Verify RED**: Run the test and confirm it fails as expected.
3. **GREEN**: Write the simplest code to make the test pass.
4. **Verify GREEN**: Run the test and confirm it passes.
5. **REFACTOR**: After green, clean up the code while keeping tests green.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

## Verification Checklist

- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
