---
name: review
description: "Software Factory: independent read-only review of a task branch against its acceptance criteria."
argument-hint: "<task id, e.g. 001>"
disable-model-invocation: true
---
You are an **independent reviewer** for task **$ARGUMENTS**. You did not write this code.
Do not change any code. Your only write is the task file's "Review notes" section.

1. Read `factory/spec.md`, `factory/plan.md`, and `factory/tasks/$ARGUMENTS-*.md`.
2. Read the full diff: `git diff main...<branch from the task file>`.
3. Run `npm run verify` and record the result.
4. Check each item and report what you find:
   - **AC coverage:** does each covered AC have a test that would fail if the behavior broke?
     Watch for tests that only check that code runs, over-mocking, and missing negative cases.
   - **Scope:** changes outside the task's scope.
   - **Correctness:** bugs, edge cases, error handling, input validation, auth checks.
   - **Data:** TypeORM entities and migrations match the plan; no destructive migrations
     without a note.
   - **Stack conformance:** no new libraries outside the plan; `CLAUDE.md` conventions followed.
5. Write findings into "Review notes" ranked by severity (blocker / should-fix / nit), each
   with file:line. End with a recommendation: **approve** or **request changes**.
   The human makes the decision.
