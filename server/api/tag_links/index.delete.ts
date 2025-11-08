// server/api/tag_links/index.delete.ts
import { defineEventHandler, readBody } from 'h3'
import { createResponse } from '../../utils/response'
import { safeParseOrThrow } from '../../utils/validate'
import { tagLinksDetachSchema } from '../../schemas/tag-link'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const raw = await readBody(event)
    const payload = safeParseOrThrow(tagLinksDetachSchema, raw)

    const { entity_type, entity_ids, tag_ids } = payload

    await globalThis.db
      .deleteFrom('tag_links')
      .where((eb) =>
        eb.and([
          eb('entity_type', '=', entity_type),
          eb('entity_id', 'in', entity_ids),
          eb('tag_id', 'in', tag_ids),
        ]),
      )
      .execute()

    globalThis.logger?.info('Tags detached from entities', {
      entity_type,
      entity_count: entity_ids.length,
      tag_count: tag_ids.length,
      timeMs: Date.now() - startedAt,
    })

    return createResponse({ entity_type, entity_ids, tag_ids }, null)
  } catch (error) {
    globalThis.logger?.error('Failed to detach tags from entities', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
