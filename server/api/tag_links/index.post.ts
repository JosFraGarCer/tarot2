// server/api/tag_links/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { createResponse } from '../../utils/response'
import { safeParseOrThrow } from '../../utils/validate'
import { tagLinksAttachSchema } from '../../schemas/tag-link'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const raw = await readBody(event)
    const payload = safeParseOrThrow(tagLinksAttachSchema, raw)

    const { entity_type, entity_ids, tag_ids } = payload
    const currentUserId = (event.context as any).user?.id ?? null

    await globalThis.db.transaction().execute(async (trx) => {
      for (const entityId of entity_ids) {
        const values = tag_ids.map((tagId) => ({
          entity_type,
          entity_id: entityId,
          tag_id: tagId,
          created_by: currentUserId,
        }))

        await trx
          .insertInto('tag_links')
          .values(values)
          .onConflict((oc) => oc.columns(['tag_id', 'entity_type', 'entity_id']).doNothing())
          .execute()
      }
    })

    globalThis.logger?.info('Tags attached to entities', {
      entity_type,
      entity_count: entity_ids.length,
      tag_count: tag_ids.length,
      timeMs: Date.now() - startedAt,
    })

    return createResponse({ entity_type, entity_ids, tag_ids }, null)
  } catch (error) {
    globalThis.logger?.error('Failed to attach tags to entities', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
