// server/api/content_feedback/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { sql } from 'kysely'
import { createResponse } from '../../utils/response'
import { safeParseOrThrow } from '../../utils/validate'
import { contentFeedbackCreateSchema } from '@shared/schemas/content-feedback'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const raw = await readBody(event)
    const payload = safeParseOrThrow(contentFeedbackCreateSchema, raw)
    const currentUserId = (event.context as any).user?.id ?? null

    const inserted = await globalThis.db
      .insertInto('content_feedback')
      .values({
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        version_number: payload.version_number ?? null,
        language_code: payload.language_code ?? null,
        comment: payload.comment,
        category: payload.category ?? null,
        status: payload.status ?? 'open',
        created_by: currentUserId,
      })
      .returning('id')
      .executeTakeFirstOrThrow()

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
      .where('cf.id', '=', inserted.id)
      .executeTakeFirstOrThrow()

    globalThis.logger?.info('Content feedback created', {
      id: inserted.id,
      entity_type: payload.entity_type,
      timeMs: Date.now() - startedAt,
    })

    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to create content feedback', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
