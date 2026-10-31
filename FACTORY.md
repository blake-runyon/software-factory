# Software Factory — Operating Manual

A structured, human-in-the-loop way to build web apps with AI agents (Claude Code).
Work moves through fixed **stages**. Each stage produces a **file artifact** in the
project repo and ends at a **human gate**. Nothing moves forward until a human approves.

## The three pieces

| Piece | Where | What it holds | How it updates |
|---|---|---|---|
| **Factory plugin** | `plugin/` in this repo | `/factory:*` commands + gate enforcement hooks | Edit → `/reload-plugins` (this machine); `bin/release` (other machines) |
| **Starter** | [blake-runyon/factory-starter](https://github.com/blake-runyon/factory-starter) | App skeleton, test harness, artifact templates, project `CLAUDE.md` | Push to the starter; affects new projects only |
| **Project** | anywhere on disk | Your app + its `factory/` artifacts | Yours |

The process lives in the plugin, so improving a command or a gate reaches **every project
at once**. The starter only holds what each project should own a copy of.

## Standard stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express + TypeScript + TypeORM |
| Database | PostgreSQL in Docker (docker compose) |
| Backend unit tests | Vitest |
| Backend API e2e tests | Vitest + Supertest against a real Postgres test DB (no DB mocks) |
| Frontend e2e tests | Playwright against the full running stack |
| Repo layout | npm workspaces monorepo: `apps/web`, `apps/api` |

Every project exposes one gate command: **`npm run verify`**, which runs
lint → typecheck → unit → API e2e → Playwright e2e. A task is never "ready" unless it passes.

## Stages and gates

```
 idea ──▶ [1 SPEC] ──▶ GATE 1 ──▶ [2 PLAN] ──▶ GATE 2 ──▶ [3 BUILD task] ──▶ GATE 3 ──▶ merge
           spec.md      human      plan.md      human      branch + tests    human      human
                       approves    tasks/*.md  approves    + build report   reviews
                                                                             (repeat per task)
```

| Stage | Command | Writes | Gate (human) |
|---|---|---|---|
| 0. New project | `/factory:new <name> [dir]` | new repo cloned from the starter | `npm run setup && npm run verify` green |
| 1. Spec | `/factory:spec <idea>` | `factory/spec.md` | `factory/bin/approve factory/spec.md` |
| 2. Plan | `/factory:plan` | `factory/plan.md`, `factory/tasks/NNN-*.md` | `factory/bin/approve factory/plan.md` |
| 3. Build | `/factory:build NNN` | `task/NNN-*` branch, code, tests, build report | Review diff, approve task, merge |
| (opt) Review | `/factory:review NNN` | review notes in the task file | Informs Gate 3 |
| Status | `/factory:status` | — | Tells you the next action |

Only you can start a stage: Claude cannot invoke the `/factory:*` skills on its own.

## Human-in-the-loop rules (enforced by the plugin)

The plugin's hooks check every Edit, Write and Bash call Claude makes, in every project:

1. **Only humans approve.** Claude cannot set `status: approved` or `done`, or fill in
   `approved_by` / `approved_on`, in `factory/spec.md`, `plan.md` or `tasks/*.md`.
2. **Approved artifacts are locked.** Claude cannot edit an artifact that is `approved` or
   `done`. To change one, a human sets `status: draft` and re-runs the stage.
3. **Only humans run `factory/bin/approve`.**
4. **Only humans merge or push.** `git push`, `git merge` and `git rebase` are refused.
   Claude commits on `task/*` branches only.

Each project's `.claude/settings.json` repeats rules 3 and 4 as permission denies, as a backup
if the plugin is ever disabled. Also, by instruction: one task at a time, and ambiguity stops
the line (Claude asks and records the question rather than guessing).

## Task status lifecycle

`todo` → `in-progress` → `ready-for-review` → `approved` (human) → `done` (human, after merge)

## Testing policy

- Every acceptance criterion (AC) in the spec maps to at least one test, named with
  its AC id (e.g. `AC2.1: user can log in with valid credentials`).
- Layer choice: user-visible behavior → Playwright; API contract & persistence →
  API e2e; pure logic → unit.
- Tests are written before or alongside implementation, never after the fact to fit.
- Never skip, delete, or weaken a test to make `verify` pass. Report the failure instead.

## Definition of Done (per task)

- [ ] All ACs the task covers have passing tests at the planned layer
- [ ] `npm run verify` passes from a clean state
- [ ] Build report filled in (files changed, tests added, deviations, open questions)
- [ ] Human reviewed the diff and ran `factory/bin/approve` on the task file
- [ ] Human merged the branch and ran `factory/bin/approve <task> done`

## Updating the factory

**Plugin (commands and gates):**
- *This machine:* the plugin is installed from this folder and read live from `plugin/`.
  Edit a skill or hook, run `claude plugin test plugin`, then `/reload-plugins` in any open
  session. No version bump needed.
- *Releasing:* `bin/release [patch|minor|major] "what changed"` validates, tests, bumps the
  version, commits, tags `factory-v<version>`, and pushes if the repo has a remote.
  Machines that installed from GitHub then run `claude plugin update factory@software-factory`.

**Starter (skeleton, templates, project `CLAUDE.md`):** edit `~/Documents/projects/factory-starter`,
run `npm run verify`, commit, push. Only new projects get it. Each project records its starter
commit in `factory/STARTER_VERSION`. To try an unpushed starter:
`FACTORY_STARTER_REPO=file:///path/to/factory-starter` before `/factory:new`.

## Installing on another machine

```bash
claude plugin marketplace add <this repo: GitHub owner/repo, git URL, or local path>
claude plugin install factory@software-factory
```

## Repo layout (this factory)

```
FACTORY.md                       this manual
.claude-plugin/marketplace.json  makes this repo a plugin marketplace
plugin/
  .claude-plugin/plugin.json     name + version
  skills/<stage>/SKILL.md        /factory:spec, plan, build, review, status, new
  skills/new/new-project.sh      clones the starter
  hooks/register.ts              gate enforcement (Edit, Write, Bash)
  hooks/guard.ts, guard.test.ts  gate logic + tests (claude plugin test plugin)
bin/release                      version, tag and publish the plugin
```
