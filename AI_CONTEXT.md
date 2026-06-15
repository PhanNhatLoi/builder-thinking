# AI_CONTEXT.md

## Purpose

This file is the root entry point for any AI agent (Codex, Claude Code, Cursor, GPT, etc.).

Before starting work, always read this file first.

This file acts as:

- Memory Index
- Context Router
- Project Knowledge Map
- Agent Operating System

The goal is:

- Minimize context loss
- Reuse historical knowledge
- Avoid repeating mistakes
- Preserve architectural decisions
- Enable long-term project learning

---

# Startup Flow

When a new session begins:

## Step 1 — Ensure Memory System Exists

Verify that the following directory exists:

```text
ai-guide/
```

Required files:

```text
ai-guide/AI_CONTEXT.md
ai-guide/PROJECT_CONTEXT.md
ai-guide/DECISIONS.md
ai-guide/AGENT_RULES.md
ai-guide/ACTIVE_TASKS.md
ai-guide/KNOWN_ISSUES.md
ai-guide/LESSONS_LEARNED.md
```

If any file is missing:

1. Create it automatically.
2. Generate a basic template.
3. Record that it was auto-created.
4. Continue initialization.

Never stop because a memory file is missing.

---

## Step 2 — Load Context

Read in the following order:

1. ai-guide/AI_CONTEXT.md
2. ai-guide/PROJECT_CONTEXT.md
3. ai-guide/DECISIONS.md
4. ai-guide/AGENT_RULES.md
5. ai-guide/ACTIVE_TASKS.md
6. ai-guide/KNOWN_ISSUES.md
7. ai-guide/LESSONS_LEARNED.md

---

## Step 3 — Build Working Context

Create an internal understanding of:

- Project goals
- Current architecture
- Coding rules
- Active work
- Known issues
- Previous lessons

Identify:

- Current progress
- Pending tasks
- Risks
- Areas requiring attention

---

## Step 4 — Context Validation

Check for:

- Missing documentation
- Empty files
- Outdated decisions
- Contradicting rules

If found:

- Report findings
- Suggest updates
- Optionally repair documentation

---

## Step 5 — Ready State

Output:

- Project summary
- Active tasks
- Important warnings
- Recommended next actions

Only after reaching Ready State may implementation begin.

---

# Memory Structure

## PROJECT_CONTEXT.md

Project overview.

Contains:

- Business goals
- Technical stack
- Architecture overview
- Folder structure
- Major modules
- External integrations

Purpose:

Allows AI to understand the project quickly.

---

## DECISIONS.md

Historical technical decisions.

Contains:

- Why something was chosen
- Why alternatives were rejected
- Constraints
- Trade-offs

Purpose:

Prevent AI from suggesting already rejected solutions.

---

## AGENT_RULES.md

Permanent development rules.

Contains:

- Coding standards
- Naming conventions
- Refactoring restrictions
- Security requirements
- Testing requirements

Purpose:

Prevent violations of project standards.

---

## ACTIVE_TASKS.md

Current work in progress.

Contains:

- Current objectives
- Open tasks
- Blockers
- Next actions

Purpose:

Allow seamless continuation across sessions.

---

## KNOWN_ISSUES.md

Known problems.

Contains:

- Bugs
- Technical debt
- Edge cases
- Performance concerns

Purpose:

Help AI avoid introducing known failures.

---

## LESSONS_LEARNED.md

Accumulated project knowledge.

Contains:

- Common mistakes
- Debugging discoveries
- Performance lessons
- Integration notes

Purpose:

Project memory that grows over time.

---

## FLOWS/

Contains business and technical flows.

Examples:

- auth-flow.md
- payment-flow.md
- order-flow.md
- notification-flow.md

Purpose:

Provide detailed process knowledge.

---

## FEATURES/

Feature-specific knowledge.

Examples:

- billing-feature.md
- user-management-feature.md
- reporting-feature.md

Purpose:

Deep context for individual modules.

---

# Command Keywords

The following keywords are shortcuts.

---

## INIT

Meaning:

Start a new session.

Actions:

1. Read all required context files.
2. Build project understanding.
3. Summarize current state.
4. Identify active tasks.
5. Wait for instructions.

---

## BUILD

Meaning:

Implement a new feature.

Expected format:

Current State:
...

Desired Output:
...

Requirements:
...

Actions:

- Analyze existing architecture.
- Reuse existing patterns.
- Avoid duplication.
- Implement requested functionality.

---

## ANALYZE

Meaning:

Investigate a problem.

Actions:

- Identify root cause.
- Explain why it happens.
- Identify affected components.
- Provide evidence.

Do not code immediately.

---

## FIX

Meaning:

Repair an existing problem.

Actions:

1. Analyze first.
2. Produce at least 3 possible solutions when feasible.
3. Compare advantages and disadvantages.
4. Recommend best option.
5. Implement after approval.

After fixing:

Update:

- KNOWN_ISSUES.md
- LESSONS_LEARNED.md

---

## ENHANCE

Meaning:

Improve an existing system.

Actions:

- Analyze current implementation.
- Identify weaknesses.
- Suggest improvements.
- Estimate risks.
- Implement approved enhancement.

---

## REVIEW

Meaning:

Review code quality.

Actions:

Check:

- Architecture
- Security
- Performance
- Readability
- Maintainability
- Scalability

Provide prioritized findings.

---

## LEARN

Meaning:

Persist newly acquired knowledge.

Actions:

Update all relevant memory files.

Possible targets:

- DECISIONS.md
- LESSONS_LEARNED.md
- KNOWN_ISSUES.md
- FLOWS/\*
- FEATURES/\*

Goal:

Ensure future sessions benefit from current discoveries.

---

## SESSION_END

Meaning:

Prepare project memory for future sessions.

Actions:

1. Summarize completed work.
2. Summarize pending work.
3. Summarize new decisions.
4. Summarize lessons learned.
5. Update all memory files.
6. Update ACTIVE_TASKS.md.

Output:

Session Summary.

---

# Agent Principles

Always:

- Think before coding.
- Prefer existing patterns.
- Preserve architecture consistency.
- Explain major decisions.
- Learn from previous sessions.
- Update memory after significant discoveries.

Never:

- Ignore project rules.
- Introduce duplicate patterns.
- Rewrite unrelated code.
- Forget to update project memory.

The project memory system is considered the source of truth.
