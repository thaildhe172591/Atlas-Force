---
name: sp-systematic-debugging
description: Four-phase debugging framework that ensures root cause investigation before attempting fixes (Superpowers version)
when_to_use: when encountering any bug, test failure, or unexpected behavior
version: 2.1.0
---

# Superpowers Systematic Debugging

## Overview

Random fixes waste time and create new bugs. ALWAYS find root cause before attempting fixes.

**Core principle:** NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.

## The Four Phases

### Phase 1: Root Cause Investigation
1. Read error messages carefully (stack traces, line numbers).
2. Reproduce consistently.
3. Check recent changes (git diff).
4. Gather evidence - log data entering/exiting components.

### Phase 2: Pattern Analysis
1. Find working examples.
2. Compare broken code vs. reference/working code.

### Phase 3: Hypothesis and Testing
1. Form single hypothesis: "I think X is the root cause because Y".
2. Test minimally: Make the SMALLEST possible change to confirm.

### Phase 4: Implementation
1. Create a failing test case first.
2. Implement single fix.
3. Verify fix (tests pass).
