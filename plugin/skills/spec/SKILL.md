---
name: spec
description: "Software Factory stage 1: interview the human and draft factory/spec.md with testable acceptance criteria."
argument-hint: "[short description of the idea]"
disable-model-invocation: true
---
You are running **Stage 1 (Spec)** of the Software Factory. Idea: $ARGUMENTS

1. Confirm this is a factory project: `factory/spec.md` must exist. If not, stop and suggest
   `/factory:new <name>`.
2. Read `factory/spec.md`. If its `status` is `approved`, stop: tell the human the spec is
   locked and they must set `status: draft` to reopen it.
3. Interview the human. Ask in small batches (at most 4 questions at a time) about:
   problem and users, roles and auth, core features, data, screens, constraints, non-goals.
   Prefer concrete options with a recommended default. Do not invent requirements.
4. Write `factory/spec.md` using its existing structure:
   - Every feature has acceptance criteria in Given/When/Then form with ids (`AC<feature>.<n>`).
   - Each AC is observable and testable, and is tagged with a proposed test layer
     (`ui-e2e`, `api-e2e`, or `unit`).
   - Anything unresolved goes under "Open questions". Do not guess.
5. Leave `status: draft`. Never approve it yourself (the factory plugin blocks it anyway).
6. Finish with a short summary: feature count, AC count, open questions. Then say:

   > **Gate 1:** Review `factory/spec.md`. Edit anything you like. When satisfied, run
   > `factory/bin/approve factory/spec.md`, then `/factory:plan`.
