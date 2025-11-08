// server/api/content_versions/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { sql } from 'kysely'
import { safeParseOrThrow } from '../../utils/validate'
import { createResponse } from '../../utils/response'
import { contentVersionCreateSchema } from '../../schemas/content-version'
import { conflict } from '../../utils/error'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const raw = await readBody(event)
    const payload = safeParseOrThrow(contentVersionCreateSchema, raw)
    const currentUserId = (event.context as any).user?.id ?? null

    // Ensure semver uniqueness before insert for friendlier error message
    const existing = await globalThis.db
      .selectFrom('content_versions')
      .select('id')
      .where('version_semver', '=', payload.version_semver)
      .executeTakeFirst()
    if (existing) conflict('version_semver already exists')

    const inserted = await globalThis.db
      .insertInto('content_versions')
      .values({
        version_semver: payload.version_semver,
        description: payload.description ?? null,
        metadata: payload.metadata ?? {},
        created_by: currentUserId,
      })
      .returning('id')
      .executeTakeFirstOrThrow()

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
        sql`coalesce(u.username, u.email)`.as('created_by_name'),
      ])
      .where('cv.id', '=', inserted.id)
      .executeTakeFirstOrThrow()

    globalThis.logger?.info('Content version created', {
      id: inserted.id,
      version_semver: payload.version_semver,
      timeMs: Date.now() - startedAt,
    })

    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to create content version', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
