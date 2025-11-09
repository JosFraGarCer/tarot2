// server/api/content_versions/[id].get.ts
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
      .selectFrom('content_versions as cv')
      .leftJoin('users as u', 'u.id', 'cv.created_by')
      .select([
        'cv.id',
        'cv.version_semver',
        'cv.description',
        'cv.metadata',
        'cv.created_by',
        'cv.created_at',
        'cv.release',
        sql`coalesce(u.username, u.email)`.as('created_by_name'),
      ])
      .where('cv.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('Content version not found')

    globalThis.logger?.info('Content version fetched', {
      id,
      timeMs: Date.now() - startedAt,
    })

    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch content version', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
