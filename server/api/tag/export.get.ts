// server/api/tag/export.get.ts
import { defineEventHandler } from 'h3'
import { exportEntityData } from '../../utils/entityTransferService'

export default defineEventHandler(async (event) => {
  const logger = event.context.logger ?? globalThis.logger
  const startedAt = Date.now()

  logger?.info?.({
    scope: 'tag.export.start',
    requestId: event.context.requestId ?? null,
    time: new Date().toISOString(),
  }, 'Tag export started')

  const result = await exportEntityData({
    event,
    entity: 'tag',
    table: 'tags',
    translationForeignKey: 'tag_id',
    scope: 'tag.export',
  })

  logger?.info?.({
    scope: 'tag.export.end',
    requestId: event.context.requestId ?? null,
    timeMs: Date.now() - startedAt,
    count: Array.isArray((result.data as Record<string, unknown>)?.tags) ? ((result.data as Record<string, unknown>).tags as unknown[]).length : null,
  }, 'Tag export completed')

  return result
})
