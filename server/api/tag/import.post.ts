// server/api/tag/import.post.ts
import { defineEventHandler, readBody } from 'h3'
import { tagImportSchema } from '@shared/schemas/entities/tag'

export default defineEventHandler(async (event) => {
  const logger = event.context.logger ?? globalThis.logger
  const startedAt = Date.now()

  logger?.info?.({
    scope: 'tag.import.start',
    requestId: event.context.requestId ?? null,
    time: new Date().toISOString(),
  }, 'Tag import started')

  const raw = await readBody(event)
  tagImportSchema.parse(raw ?? {})

  const result = await importEntityData({
    event,
    entity: 'tag',
    table: 'tags',
    translationForeignKey: 'tag_id',
    scope: 'tag.import',
  })

  logger?.info?.({
    scope: 'tag.import.end',
    requestId: event.context.requestId ?? null,
    timeMs: Date.now() - startedAt,
    created: (result.data as any)?.created ?? null,
    updated: (result.data as any)?.updated ?? null,
    errors: Array.isArray((result.data as any)?.errors) ? (result.data as any).errors.length : null,
  }, 'Tag import completed')

  return result
})
