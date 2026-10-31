// Pure gate logic: no engine calls, so it is easy to test.

const ARTIFACT = /(^|\/)factory\/(spec\.md|plan\.md|tasks\/(?!_TEMPLATE\.md$)[^/]+\.md)$/
const LOCKED = new Set(['approved', 'done'])

export type Front = { status: string; approvedBy: string; approvedOn: string }

/** True for the factory artifacts whose approval only a human controls. */
export function isArtifact(path: string): boolean {
  return ARTIFACT.test(path)
}

/** Reads the leading `---` frontmatter block. Missing fields come back empty. */
export function parseFront(text: string): Front {
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? ''
  const field = (name: string) =>
    (new RegExp(`^${name}:[ \\t]*(.*)$`, 'm').exec(block)?.[1] ?? '')
      .replace(/\s+#.*$/, '')
      .replace(/^["']|["']$/g, '')
      .trim()
  return { status: field('status'), approvedBy: field('approved_by'), approvedOn: field('approved_on') }
}

/** What an Edit call would leave in the file. */
export function applyEdit(before: string, oldText: string, newText: string, replaceAll = false): string {
  if (oldText === '' || !before.includes(oldText)) return before
  return replaceAll ? before.split(oldText).join(newText) : before.replace(oldText, () => newText)
}

/**
 * Judges a change to a file. `before` is null for a new file.
 * Returns the reason to refuse, or undefined to allow.
 */
export function checkArtifactChange(path: string, before: string | null, after: string): string | undefined {
  if (!isArtifact(path)) return undefined
  const name = /factory\/(spec\.md|plan\.md|tasks\/[^/]+\.md)$/.exec(path)?.[0] ?? path
  const b = before === null ? { status: '', approvedBy: '', approvedOn: '' } : parseFront(before)
  const a = parseFront(after)

  if (LOCKED.has(b.status)) {
    return `${name} is ${b.status}, so it is locked. Only the human can reopen it, by setting status: draft. Ask them.`
  }
  if (LOCKED.has(a.status)) {
    return `Only the human can set ${name} to status: ${a.status}. Leave the status as it is and ask them to run factory/bin/approve ${name}.`
  }
  if (a.approvedBy !== b.approvedBy || a.approvedOn !== b.approvedOn) {
    return `approved_by and approved_on in ${name} are written only by factory/bin/approve, which the human runs. Leave them unchanged.`
  }
  return undefined
}

const BLOCKED_GIT = new Set(['push', 'merge', 'rebase'])
const GIT_OPTS_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace'])
const WRITES = /(^|\s)(-i\b|--in-place|tee\b|mv\b|cp\b|python3?\b|node\b|ruby\b)|>/

const RUNNERS = new Set(['bash', 'sh', 'zsh', 'exec', 'sudo', 'env', 'command', 'nohup', 'time', 'source', '.'])

/** True when words[i] is what runs: first in its segment, after VAR=x, or after a runner like bash. */
function isCommandPosition(words: string[], i: number): boolean {
  for (let k = 0; k < i; k++) {
    const w = words[k]
    if (!(RUNNERS.has(w) || /^[A-Za-z_][A-Za-z0-9_]*=/.test(w) || (k > 0 && w.startsWith('-')))) return false
  }
  return true
}

/** Judges a shell command. Returns the reason to refuse, or undefined to allow. */
export function checkBash(command: string): string | undefined {
  for (const segment of command.split(/&&|\|\||[;|\n&]/)) {
    const words = segment.trim().split(/\s+/).map(w => w.replace(/^["'(]+|["')]+$/g, ''))
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      if (/(^|\/)factory\/bin\/approve$/.test(word) && isCommandPosition(words, i)) {
        return 'factory/bin/approve is for the human only. Ask them to run it.'
      }
      if (word === 'git' || word.endsWith('/git')) {
        let j = i + 1
        while (j < words.length && words[j].startsWith('-')) {
          j += GIT_OPTS_WITH_VALUE.has(words[j]) ? 2 : 1
        }
        if (BLOCKED_GIT.has(words[j])) {
          return `git ${words[j]} is for the human only in the Software Factory. Commit on the task branch and ask them to ${words[j]}.`
        }
      }
    }
  }
  const touchesArtifact = /factory\/(spec\.md|plan\.md|tasks\/)/.test(command)
  const touchesApproval = /status:\s*["']?(approved|done)|approved_(by|on)/.test(command)
  if (touchesArtifact && touchesApproval && WRITES.test(command)) {
    return 'Factory approvals are changed only by the human with factory/bin/approve. Use the Edit tool for other artifact changes.'
  }
  return undefined
}
