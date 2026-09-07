import { listSkillsCatalog } from '@/lib/skills'

export const runtime = 'nodejs'

/**
 * Exposes the skill catalog (name, description, and whether each skill is
 * shipped locally or fetched live from a remote URL) to the client, so the
 * UI can show visitors that a skill's instructions are pulled from the
 * internet at request time — not baked into this repo.
 */
export async function GET() {
  const skills = await listSkillsCatalog()
  return Response.json({ skills })
}
