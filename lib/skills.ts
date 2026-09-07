import 'server-only'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Agent Skills: instead of one long hardcoded system-prompt string, each
 * capability lives in its own `SKILL.md` file under `skills/<name>/`, with a
 * YAML frontmatter `name` + `description`. The system prompt only lists the
 * catalog (name + description); the agent loads a skill's full body on
 * demand via the `read_skill` tool. This is the same progressive-disclosure
 * pattern as Claude/Agent Skills — full instructions only enter context when
 * they're actually needed, and adding a new capability is just a new folder.
 */

const SKILLS_DIR = path.join(process.cwd(), 'skills')

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

let cache: ParsedSkill[] | null = null

function loadAllSkills(): ParsedSkill[] {
  if (cache) return cache
  const dirs = readdirSync(SKILLS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory())
  cache = dirs.map((dir) => parseSkillFile(readFileSync(path.join(SKILLS_DIR, dir.name, 'SKILL.md'), 'utf-8')))
  return cache
}

/** Name + description of every skill, for the system prompt's catalog. */
export function listSkillsCatalog(): SkillMeta[] {
  return loadAllSkills().map(({ name, description }) => ({ name, description }))
}

/** The full instructions for one skill, loaded on demand by the agent. */
export function readSkillContent(name: string): string | null {
  return loadAllSkills().find((s) => s.name === name)?.body ?? null
}
