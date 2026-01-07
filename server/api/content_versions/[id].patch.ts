// server/api/content_versions/[id].patch.ts
import { defineEventHandler, readValidatedBody } from "h3"
import { sql } from 'kysely'
import { readValidatedBody } from "h3"
import { createResponse } from '../../utils/response'
import { contentVersionUpdateSchema } from '../../schemas/content-version'
import { badRequest, notFound, conflict } from '../../utils/error'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const idParam = event.context.params?.id
    const id = Number(idParam)
    if (!Number.isFinite(id)) badRequest('Invalid id')

    const raw = await readBody(event)
    const payload = await readValidatedBody(event, contentVersionUpdateSchema.parse)

    const patch: Record<string, unknown> = {}

    if (payload.version_semver !== undefined) {
      const exists = await globalThis.db
        .selectFrom('content_versions')
        .select('id')
        .where('version_semver', '=', payload.version_semver)
        .where('id', '!=', id)
        .executeTakeFirst()
      if (exists) conflict('version_semver already exists')
      patch.version_semver = payload.version_semver
    }
    if (payload.description !== undefined) patch.description = payload.description ?? null
    if (payload.metadata !== undefined) patch.metadata = payload.metadata ?? {}
    if (payload.release !== undefined) patch.release = payload.release

    if (Object.keys(patch).length > 0) {
      const updated = await globalThis.db
        .updateTable('content_versions')
        .set(patch)
        .where('id', '=', id)
        .returning('id')
        .executeTakeFirst()

      if (!updated) notFound('Content version not found')
    } else {
      const exists = await globalThis.db
        .selectFrom('content_versions')
        .select('id')
        .where('id', '=', id)
        .executeTakeFirst()
      if (!exists) notFound('Content version not found')
    }

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
      .executeTakeFirstOrThrow()

    globalThis.logger?.info('Content version updated', {
      id,
      timeMs: Date.now() - startedAt,
    })

    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to update content version', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
