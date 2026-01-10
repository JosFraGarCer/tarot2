// server/api/content_feedback/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import { sql } from 'kysely'
import { safeParseOrThrow } from '../../utils/validate'
import { createResponse } from '../../utils/response'
import { contentFeedbackUpdateSchema } from '@shared/schemas/content-feedback'
import { notFound, badRequest } from '../../utils/error'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const idParam = event.context.params?.id
    const id = Number(idParam)
    if (!Number.isFinite(id)) badRequest('Invalid id')

    const raw = await readBody(event)
    const payload = safeParseOrThrow(contentFeedbackUpdateSchema, raw)

    const patch: Record<string, unknown> = {}
    if (payload.comment !== undefined) patch.comment = payload.comment
    if (payload.category !== undefined) patch.category = payload.category ?? null
    if (payload.language_code !== undefined) patch.language_code = payload.language_code ?? null
    if (payload.status !== undefined) patch.status = payload.status
    if (payload.version_number !== undefined) patch.version_number = payload.version_number ?? null
    if (payload.resolved_by !== undefined) patch.resolved_by = payload.resolved_by ?? null
    if (payload.resolved_at !== undefined) patch.resolved_at = payload.resolved_at ?? null

    // Manejo especial para reopen: asegurarse que resolved_by sea null en la BD
    if (payload.status === 'open' && payload.resolved_by === null) {
      patch.resolved_by = null
    }

    if (Object.keys(patch).length > 0) {
      // Para reopen, usar SQL directo para asegurar que resolved_by sea NULL
      if (payload.status === 'open' && payload.resolved_by === null) {
        await sql`UPDATE content_feedback 
          SET status = 'open', resolved_at = null, resolved_by = null 
          WHERE id = ${id}`.execute(globalThis.db)
      } else {
        const updated = await globalThis.db
          .updateTable('content_feedback')
          .set(patch)
          .where('id', '=', id)
          .returning('id')
          .executeTakeFirst()

        if (!updated) notFound('Content feedback not found')
      }
    } else {
      const exists = await globalThis.db
        .selectFrom('content_feedback')
        .select('id')
        .where('id', '=', id)
        .executeTakeFirst()

      if (!exists) notFound('Content feedback not found')
    }

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
      .executeTakeFirstOrThrow()

    globalThis.logger?.info('Content feedback updated', {
      id,
      timeMs: Date.now() - startedAt,
    })

    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to update content feedback', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
