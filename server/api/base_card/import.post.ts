// server/api/base_card/import.post.ts
import { defineEventHandler } from 'h3'
import { importEntities } from '../../utils/entityCrudHelpers'
import { tryGetUserId } from '../../plugins/auth'

export default defineEventHandler(async (event) => {
  const userId = await tryGetUserId(event)

  return importEntities({ event, table: 'base_card', translationForeignKey: 'card_id', userId })
})
