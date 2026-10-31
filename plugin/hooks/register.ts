import type { Register } from 'claude-code'
import { applyEdit, checkArtifactChange, checkBash, isArtifact } from './guard.ts'

// Enforces the Software Factory's human gates on Claude's own tool calls:
// approvals, locked artifacts, merges and pushes stay with the human.
export const register: Register = on => {
  const failClosed = (why: string) => `factory: ${why} Its gate check failed, so the change was stopped.`

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    const path = await absolute($, e.file_path)
    if (!isArtifact(path)) return next(e)
    const before = await readOrNull($, path)
    const after = applyEdit(before ?? '', e.old_string, e.new_string, e.replace_all === true)
    const deny = checkArtifactChange(path, before, after)
    return deny ? { deny: `factory: ${deny}` } : next(e)
  }).catch(($, e, next) => (next.called ? next(e) : { deny: failClosed('Edit of a factory artifact.') }))

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    const path = await absolute($, e.file_path)
    if (!isArtifact(path)) return next(e)
    const deny = checkArtifactChange(path, await readOrNull($, path), e.content)
    return deny ? { deny: `factory: ${deny}` } : next(e)
  }).catch(($, e, next) => (next.called ? next(e) : { deny: failClosed('Write of a factory artifact.') }))

  on('tool.call', { tool: 'Bash' }, ($, e, next) => {
    const deny = checkBash(e.command)
    return deny ? { deny: `factory: ${deny}` } : next(e)
  }).catch(($, e, next) => (next.called ? next(e) : { deny: failClosed('Shell command.') }))
}

type Engine = Parameters<Parameters<Parameters<Register>[0]>[2]>[0]

async function absolute($: Engine, path: string): Promise<string> {
  return path.startsWith('/') ? path : `${await $.session.cwd()}/${path}`
}

async function readOrNull($: Engine, path: string): Promise<string | null> {
  if (!(await $.fs.exists(path))) return null
  return await $.fs.read(path)
}
