// server/api/tag_links/index.delete.ts
import { defineEventHandler, readValidatedBody } from "h3"
import { createResponse } from '../../utils/response'
import { readValidatedBody } from "h3"
import { tagLinksDetachSchema } from '../../schemas/tag-link'
import { touchEntityModifiedAt } from '../../utils/eagerTags'
import type { DB } from '../../database/types'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const raw = await readBody(event)
    const payload = await readValidatedBody(event, tagLinksDetachSchema.parse)

    const { entity_type, entity_ids, tag_ids } = payload

    await globalThis.db.transaction().execute(async (trx) => {
      await trx
        .deleteFrom('tag_links')
        .where((eb) =>
          eb.and([
            eb('entity_type', '=', entity_type),
            eb('entity_id', 'in', entity_ids),
            eb('tag_id', 'in', tag_ids),
          ]),
        )
        .execute()

      // DEEP MODIFIED CHECK: Update base entities modified_at when tags are detached
      for (const id of entity_ids) {
        await touchEntityModifiedAt(trx, entity_type as keyof DB, id)
      }
    })

    globalThis.logger?.info({
      entity_type,
      entity_count: entity_ids.length,
      tag_count: tag_ids.length,
      timeMs: Date.now() - startedAt,
    }, 'Tags detached from entities')

    return createResponse({ entity_type, entity_ids, tag_ids }, null)
  } catch (error) {
    globalThis.logger?.error({
      error: error instanceof Error ? error.message : String(error),
    }, 'Failed to detach tags from entities')
    throw error
  }
})
