---
name: plan
description: "Software Factory stage 2: turn the approved spec into factory/plan.md and task files."
disable-model-invocation: true
---
You are running **Stage 2 (Plan)** of the Software Factory.

1. Read `factory/spec.md`. If `status` is not `approved`, stop and tell the human Gate 1 is open.
   If the spec has unresolved open questions, list them and ask before planning.
2. Read `factory/plan.md`. If it is `approved`, stop: the plan is locked.
3. Read the project's `CLAUDE.md` and current code so the plan fits what already exists.
4. Fill in `factory/plan.md`: architecture, TypeORM entities, API endpoints, frontend routes,
   AC coverage table, task table, risks. Copy the spec's `approved_on` into `spec_approved_on`.
   Any library beyond the standard stack must be listed under Risks & assumptions for human OK.
5. Break the work into tasks. Write each one as `factory/tasks/NNN-<slug>.md` from `_TEMPLATE.md`:
   - Tasks are thin vertical slices (entity + API + UI + tests) that fit in one reviewable PR.
   - Each task lists the ACs it covers and maps each AC to a test layer, file and name.
   - Order them so dependencies come first. The starter skeleton (health endpoint, test
     harnesses, shadcn setup) already exists and `npm run verify` is green, so task 001
     starts on real features. Do not plan tasks that re-create the skeleton.
   - Every spec AC must be covered by at least one task. Check this and say so explicitly.
6. Leave every status as `draft` / `todo`. Never approve anything yourself.
7. Finish with the task table and any open questions, then say:

   > **Gate 2:** Review `factory/plan.md` and `factory/tasks/`. Reorder, split, or cut tasks
   > as you like. When satisfied, run `factory/bin/approve factory/plan.md`, then `/factory:build 001`.
