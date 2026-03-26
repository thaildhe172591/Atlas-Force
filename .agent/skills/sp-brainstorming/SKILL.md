---
name: sp-brainstorming
description: Interactive idea refinement using Socratic method to develop fully-formed designs (Superpowers version)
when_to_use: when partner describes any feature or project idea, before writing code or implementation plans
version: 2.2.0
---

# Superpowers Brainstorming

## Overview

Transform rough ideas into fully-formed designs through structured questioning and alternative exploration.

**Core principle:** Ask questions to understand, explore alternatives, present design incrementally for validation.

**Announce at start:** "I'm using the Superpowers Brainstorming skill to refine your idea into a design."

## The Process

### Phase 1: Understanding
- Check current project state in working directory
- Ask ONE question at a time to refine the idea
- Prefer multiple choice when possible
- Gather: Purpose, constraints, success criteria

### Phase 2: Exploration
- Propose 2-3 different approaches
- For each: Core architecture, trade-offs, complexity assessment
- Ask your human partner which approach resonates

### Phase 3: Design Presentation
- Present in 200-300 word sections
- Cover: Architecture, components, data flow, error handling, testing
- Ask after each section: "Does this look right so far?"

### Phase 4: Planning Handoff
Ask: "Ready to create the implementation plan?"

When your human partner confirms:
- Announce: "I'm using the Superpowers Writing Plans skill to create the implementation plan."
- Switch to `sp-writing-plans` skill
