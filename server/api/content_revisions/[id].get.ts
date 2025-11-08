// server/api/content_revisions/[id].get.ts
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
      .selectFrom('content_revisions as cr')
      .leftJoin('users as u', 'u.id', 'cr.created_by')
      .leftJoin('content_versions as cv', 'cv.id', 'cr.content_version_id')
      .select([
        'cr.id',
        'cr.entity_type',
        'cr.entity_id',
        'cr.version_number',
        'cr.status',
        'cr.language_code',
        'cr.content_version_id',
        'cr.created_by',
        'cr.created_at',
        'cr.notes',
        'cr.diff',
        'cr.prev_snapshot',
        'cr.next_snapshot',
        sql`coalesce(u.username, u.email)`.as('created_by_name'),
        sql`cv.version_semver`.as('content_version_semver'),
      ])
      .where('cr.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('Content revision not found')

    globalThis.logger?.info('Content revision fetched', {
      id,
      timeMs: Date.now() - startedAt,
    })

    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch content revision', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
