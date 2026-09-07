import 'server-only'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Agent Skills: instead of one long hardcoded system-prompt string, each
 * capability lives in its own `SKILL.md` file, with a YAML frontmatter
 * `name` + `description`. The system prompt only lists the catalog (name +
 * description); the agent loads a skill's full body on demand via the
 * `read_skill` tool. This is the same progressive-disclosure pattern as
 * Claude/Agent Skills — full instructions only enter context when they're
 * actually needed.
 *
 * A skill's source can be either:
 *  - local: a `SKILL.md` file under `skills/<name>/` shipped with this repo.
 *  - remote: a URL fetched live at request time. No local copy is kept, so
 *    the agent always reads the upstream maintainer's current instructions
 *    (e.g. Kernel's own published skill docs) instead of a pinned snapshot.
 */

const SKILLS_DIR = path.join(process.cwd(), 'skills')

/** Remote skills: fetched live from their source URL, never copied locally. */
const REMOTE_SKILLS = [
  'https://raw.githubusercontent.com/kernel/skills/HEAD/plugins/kernel-cli/skills/kernel-cli/references/browser-management.md',
]

export interface SkillMeta {
  name: string
  description: string
}

interface ParsedSkill extends SkillMeta {
  body: string
}

function parseSkillFile(raw: string): ParsedSkill {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return { name: 'unknown', description: '', body: raw.trim() }
  const [, frontmatter, body] = match
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? 'unknown'
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? ''
  return { name, description, body: body.trim() }
}

/** Rewrite a GitHub "blob" page URL into its raw-content equivalent. */
function toRawUrl(url: string): string {
  const blob = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/)
  return blob ? `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}/${blob[3]}` : url
}

function loadLocalSkills(): ParsedSkill[] {
  const dirs = readdirSync(SKILLS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory())
  return dirs.map((dir) => parseSkillFile(readFileSync(path.join(SKILLS_DIR, dir.name, 'SKILL.md'), 'utf-8')))
}

/**
 * Fetch and parse every remote skill. Uses Next.js's fetch cache (5 min) so a
 * burst of requests doesn't hammer the source on every agent turn, while
 * still picking up upstream edits shortly after they're published. A source
 * that's down or unreachable is skipped rather than failing the whole catalog.
 */
async function loadRemoteSkills(): Promise<ParsedSkill[]> {
  const results = await Promise.all(
    REMOTE_SKILLS.map(async (url) => {
      try {
        const res = await fetch(toRawUrl(url), { next: { revalidate: 300 } })
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return parseSkillFile(await res.text())
      } catch (error) {
        console.log('[v0] failed to load remote skill', url, error)
        return null
      }
    }),
  )
  return results.filter((s): s is ParsedSkill => s !== null)
}

async function loadAllSkills(): Promise<ParsedSkill[]> {
  const [local, remote] = await Promise.all([loadLocalSkills(), loadRemoteSkills()])
  return [...local, ...remote]
}

/** Name + description of every skill, for the system prompt's catalog. */
export async function listSkillsCatalog(): Promise<SkillMeta[]> {
  return (await loadAllSkills()).map(({ name, description }) => ({ name, description }))
}

/** The full instructions for one skill, loaded on demand by the agent. */
export async function readSkillContent(name: string): Promise<string | null> {
  return (await loadAllSkills()).find((s) => s.name === name)?.body ?? null
}
