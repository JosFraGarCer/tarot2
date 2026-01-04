// server/api/skill/batch.patch.ts
import { defineEventHandler } from 'h3'
import { batchUpdateEntities } from '../../utils/entityCrudHelpers'
import { tryGetUserId } from '../../plugins/auth'

export default defineEventHandler(async (event) => {
  const userId = await tryGetUserId(event)

  return batchUpdateEntities({ event, table: 'base_skills', userId })
})
