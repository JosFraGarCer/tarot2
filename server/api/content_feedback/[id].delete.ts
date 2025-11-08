// server/api/content_feedback/[id].delete.ts
import { defineEventHandler } from 'h3'
import { createResponse } from '../../utils/response'
import { badRequest, notFound } from '../../utils/error'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const idParam = event.context.params?.id
    const id = Number(idParam)
    if (!Number.isFinite(id)) badRequest('Invalid id')

    const deleted = await globalThis.db
      .deleteFrom('content_feedback')
      .where('id', '=', id)
      .returning('id')
      .executeTakeFirst()

    if (!deleted) notFound('Content feedback not found')

    globalThis.logger?.info('Content feedback deleted', {
      id,
      timeMs: Date.now() - startedAt,
    })

    return createResponse({ ok: true }, null)
  } catch (error) {
    globalThis.logger?.error('Failed to delete content feedback', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
