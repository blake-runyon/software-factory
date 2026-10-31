---
name: build
description: "Software Factory stage 3: build one task on its own branch, tests first, until npm run verify passes."
argument-hint: "<task id, e.g. 001>"
disable-model-invocation: true
---
You are running **Stage 3 (Build)** of the Software Factory for task **$ARGUMENTS**.

## Preconditions (stop and report if any fail)
- `factory/spec.md` and `factory/plan.md` both have `status: approved`.
- `factory/tasks/$ARGUMENTS-*.md` exists and its status is `todo` or `in-progress`.
- Every task in its `depends_on` has status `done`.
- The working tree is clean.

## Steps
1. Create or switch to branch `task/$ARGUMENTS-<slug>` from `main`. Record it in the task's
   `branch:` field and set `status: in-progress`.
2. Re-read the task's scope and AC → test table, and the project's `CLAUDE.md` conventions.
   If anything is unclear, ask before coding.
3. **Tests first:** write the tests from the AC table, with the AC id in each test name.
   Run them and confirm they fail for the right reason.
4. Implement the smallest change that makes them pass. Stay inside the task's scope; note
   anything out of scope under "Open questions" instead of doing it.
5. Run `npm run verify`. Fix and repeat until it passes. Never skip, delete, or weaken tests.
   If you are stuck after a few honest attempts, stop and report the failure with its output.
6. Commit on the task branch with clear messages. Do not merge or push (the plugin blocks both).
7. Fill in the task's **Build report** and set `status: ready-for-review`.
8. Finish with the build report, then say:

   > **Gate 3:** Review with `git diff main...task/$ARGUMENTS-<slug>`. Optionally run
   > `/factory:review $ARGUMENTS` in a fresh session. When satisfied, run
   > `factory/bin/approve factory/tasks/<file>`, merge the branch yourself, then
   > `factory/bin/approve factory/tasks/<file> done`.
