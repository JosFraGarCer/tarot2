import { defineEventHandler } from 'h3'
import { importEntities } from '../../utils/entityCrudHelpers'
import { getUserFromEvent } from '../../plugins/auth'

export default defineEventHandler(async (event) => {
  let userId: number | null = null
  try { const u = await getUserFromEvent(event); userId = (u as any).id ?? null } catch {}
  return importEntities({ event, table: 'base_skills', userId })
})
