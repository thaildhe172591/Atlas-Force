---
name: sp-writing-plans
description: Create detailed implementation plans with bite-sized tasks for engineers with zero codebase context (Superpowers version)
when_to_use: when design is complete and you need detailed implementation tasks
version: 2.1.0
---

# Superpowers Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase. Document everything they need to know: which files to touch, code, testing, docs.

**Announce at start:** "I'm using the Superpowers Writing Plans skill to create the implementation plan."

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence describing what this builds]
**Architecture:** [2-3 sentences about approach]
**Tech Stack:** [Key technologies/libraries]
```

## Task Structure

```markdown
### Task N: [Component Name]

**Files:**
- Create: `path/to/file`
- Modify: `path/to/existing`
- Test: `tests/path/to/test`

**Steps:**
1. Write the failing test
2. Run test to verify it fails
3. Write minimal implementation
4. Run test to verify it passes
5. Commit
```
