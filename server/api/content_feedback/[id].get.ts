// server/api/content_feedback/[id].get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'kysely'
import { createResponse } from '../../utils/response'
import { badRequest, notFound } from '../../utils/error'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const idParam = event.context.params?.id
    const id = Number(idParam)
    if (!Number.isFinite(id)) badRequest('Invalid id')

    const row = await globalThis.db
      .selectFrom('content_feedback as cf')
      .leftJoin('users as cu', 'cu.id', 'cf.created_by')
      .leftJoin('users as ru', 'ru.id', 'cf.resolved_by')
      .select([
        'cf.id',
        'cf.entity_type',
        'cf.entity_id',
        'cf.version_number',
        'cf.language_code',
        'cf.comment',
        'cf.category',
        'cf.status',
        'cf.created_by',
        'cf.resolved_by',
        'cf.created_at',
        'cf.resolved_at',
        sql`coalesce(cu.username, cu.email)`.as('created_by_name'),
        sql`coalesce(ru.username, ru.email)`.as('resolved_by_name'),
      ])
      .where('cf.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('Content feedback not found')

    globalThis.logger?.info('Content feedback fetched', {
      id,
      timeMs: Date.now() - startedAt,
    })

    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch content feedback', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
