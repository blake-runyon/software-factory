import { expect, test } from 'claude-code/testing'
import { applyEdit, checkArtifactChange, checkBash, isArtifact, parseFront } from './guard.ts'

const doc = (status: string, by = '', on = '') =>
  `---\nstatus: ${status}\napproved_by: ${by}\napproved_on: ${on}\n---\n# Spec\nBody text.\n`
const SPEC = '/p/demo/factory/spec.md'

test('artifact paths: spec, plan and tasks, but not the task template or other files', () => {
  expect(isArtifact(SPEC)).toBe(true)
  expect(isArtifact('/p/demo/factory/plan.md')).toBe(true)
  expect(isArtifact('/p/demo/factory/tasks/001-login.md')).toBe(true)
  expect(isArtifact('factory/tasks/001-login.md')).toBe(true)
  expect(isArtifact('/p/demo/factory/tasks/_TEMPLATE.md')).toBe(false)
  expect(isArtifact('/p/demo/README.md')).toBe(false)
  expect(isArtifact('/p/demo/apps/api/src/app.ts')).toBe(false)
})

test('frontmatter parsing ignores comments, quotes and the body', () => {
  expect(parseFront('---\nstatus: draft   # draft | approved\napproved_by: "Ann"\n---\nstatus: approved\n'))
    .toEqual({ status: 'draft', approvedBy: 'Ann', approvedOn: '' })
  expect(parseFront('no frontmatter')).toEqual({ status: '', approvedBy: '', approvedOn: '' })
})

test('Claude may edit a draft artifact body', () => {
  const before = doc('draft')
  expect(checkArtifactChange(SPEC, before, applyEdit(before, 'Body text.', 'New body.'))).toBeUndefined()
})

test('Claude may move a task through its own statuses', () => {
  const task = '/p/demo/factory/tasks/001-login.md'
  expect(checkArtifactChange(task, doc('todo'), doc('in-progress'))).toBeUndefined()
  expect(checkArtifactChange(task, doc('in-progress'), doc('ready-for-review'))).toBeUndefined()
})

test('Claude may not approve or mark done', () => {
  expect(checkArtifactChange(SPEC, doc('draft'), doc('approved'))).toMatch(/Only the human/)
  expect(checkArtifactChange(SPEC, doc('ready-for-review'), doc('done'))).toMatch(/Only the human/)
  expect(checkArtifactChange(SPEC, null, doc('approved'))).toMatch(/Only the human/)
})

test('Claude may not fill in approved_by or approved_on', () => {
  expect(checkArtifactChange(SPEC, doc('draft'), doc('draft', 'Claude'))).toMatch(/approved_by/)
  expect(checkArtifactChange(SPEC, doc('draft'), doc('draft', '', '2026-10-31'))).toMatch(/approved_by/)
})

test('approved and done artifacts are locked, even for body edits or reopening', () => {
  const approved = doc('approved', 'Ann', '2026-10-31')
  expect(checkArtifactChange(SPEC, approved, applyEdit(approved, 'Body text.', 'x'))).toMatch(/locked/)
  expect(checkArtifactChange(SPEC, approved, doc('draft'))).toMatch(/locked/)
  expect(checkArtifactChange(SPEC, doc('done', 'Ann', '2026-10-31'), doc('done', 'Ann', '2026-10-31'))).toMatch(/locked/)
})

test('plan may copy the spec approval date into spec_approved_on', () => {
  const plan = '/p/demo/factory/plan.md'
  const before = '---\nstatus: draft\napproved_by:\napproved_on:\nspec_approved_on:\n---\n'
  expect(checkArtifactChange(plan, before, applyEdit(before, 'spec_approved_on:', 'spec_approved_on: 2026-10-31')))
    .toBeUndefined()
})

test('messages name the artifact even when a parent folder contains "factory"', () => {
  const reason = checkArtifactChange('/x/software-factory/app/factory/spec.md', doc('draft'), doc('approved'))
  expect(reason).toMatch(/^Only the human can set factory\/spec\.md to status: approved/)
})

test('non-artifacts are never judged', () => {
  expect(checkArtifactChange('/p/demo/notes.md', doc('draft'), doc('approved'))).toBeUndefined()
})

test('shell: human-only commands are refused', () => {
  expect(checkBash('factory/bin/approve factory/spec.md')).toMatch(/human only/)
  expect(checkBash('./factory/bin/approve factory/plan.md')).toMatch(/human only/)
  expect(checkBash('cd /p && bash factory/bin/approve factory/spec.md')).toMatch(/human only/)
  expect(checkBash('git push origin main')).toMatch(/git push/)
  expect(checkBash('git -C /p/demo merge task/001-login')).toMatch(/git merge/)
  expect(checkBash('git status && git rebase main')).toMatch(/git rebase/)
  expect(checkBash("sed -i '' 's/status: draft/status: approved/' factory/spec.md")).toMatch(/approve/)
  expect(checkBash('echo "approved_by: me" >> factory/tasks/001-x.md')).toMatch(/approve/)
})

test('shell: ordinary commands pass', () => {
  expect(checkBash('git commit -m "merge and push the login fix"')).toBeUndefined()
  expect(checkBash('git log --oneline')).toBeUndefined()
  expect(checkBash('npm run verify')).toBeUndefined()
  expect(checkBash('grep -n "status: approved" factory/spec.md')).toBeUndefined()
  expect(checkBash('cat factory/bin/approve')).toBeUndefined()
})

test('through the engine: an Edit that approves the spec is refused', async ($, on) => {
  on('session.cwd', () => ({ value: '/p/demo' }))
  on('fs.exists', () => ({ value: true }))
  on('fs.read', () => ({ value: doc('draft') }))
  on('tool.call', () => ({ result: {} }))

  const denied = await $.tool.call({
    tool: 'Edit',
    file_path: 'factory/spec.md',
    old_string: 'status: draft',
    new_string: 'status: approved',
  })
  expect(JSON.stringify(denied)).toMatch(/Only the human/)

  const allowed = await $.tool.call({
    tool: 'Edit',
    file_path: '/p/demo/factory/spec.md',
    old_string: 'Body text.',
    new_string: 'Better body.',
  })
  expect(JSON.stringify(allowed)).not.toMatch(/factory:/)
})

test('through the engine: git push is refused, other commands run', async ($, on) => {
  on('tool.call', () => ({ result: { stdout: 'ok' } }))
  expect(JSON.stringify(await $.tool.call({ tool: 'Bash', command: 'git push' }))).toMatch(/human only/)
  expect(JSON.stringify(await $.tool.call({ tool: 'Bash', command: 'ls' }))).not.toMatch(/factory:/)
})
