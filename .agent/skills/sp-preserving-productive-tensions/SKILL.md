---
name: sp-preserving-productive-tensions
description: Recognize when disagreements reveal valuable context, preserve multiple valid approaches instead of forcing premature resolution (Superpowers version)
when_to_use: when oscillating between equally valid approaches that optimize for different priorities
version: 1.1.0
---

# Superpowers Preserving Productive Tensions

## Overview

Some tensions aren't problems to solve - they're valuable information to preserve. When multiple approaches are genuinely valid in different contexts, forcing a choice destroys flexibility.

**Core principle:** Preserve tensions that reveal context-dependence. Force resolution only when necessary.

## Recognizing Productive Tensions

**A tension is productive when:**
- Both approaches optimize for different valid priorities (cost vs latency, simplicity vs features).
- The "better" choice depends on deployment context.
- Stakeholders have conflicting valid concerns.

## Preservation Patterns

1. **Configuration**: Make the choice configurable at runtime.
2. **Parallel Implementations**: Maintain separate clean modules with a shared contract.
3. **Documented Trade-off**: Capture the tension explicitly in decision records.

## When to Force Resolution

- Implementation cost is prohibitive.
- Fundamental architectural conflict.
- Clear technical superiority for the specific context.
- One-way door (choice locks architecture).
