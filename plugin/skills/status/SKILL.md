---
name: status
description: "Software Factory: show where the project is and the one next human action."
disable-model-invocation: true
---
Read `factory/spec.md`, `factory/plan.md`, and every `factory/tasks/*.md` (skip `_TEMPLATE.md`).
Read only the frontmatter and "Open questions" sections; do not modify anything. Report briefly:

1. Spec status and plan status (with approver/date if approved).
2. A table of tasks: id, title, status, branch, depends_on.
3. Any open questions recorded in any artifact.
4. **Next action**: exactly one line saying what the human should do next
   (e.g. "Approve the spec", "Review task 003 on branch task/003-login", "Run /factory:build 004").
