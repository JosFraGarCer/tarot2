// server/api/content_revisions/index.post.ts
import { defineEventHandler, readValidatedBody } from "h3"
import { sql } from 'kysely'
import { readValidatedBody } from "h3"
import { createResponse } from '../../utils/response'
import { contentRevisionCreateSchema } from '../../schemas/content-revision'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const raw = await readBody(event)
    const payload = await readValidatedBody(event, contentRevisionCreateSchema.parse)
    const currentUserId = (event.context.user as { id?: number } | undefined)?.id ?? null

    const inserted = await globalThis.db
      .insertInto('content_revisions')
      .values({
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        version_number: payload.version_number,
        diff: payload.diff ?? {},
        notes: payload.notes ?? null,
        status: payload.status ?? 'draft',
        language_code: payload.language_code ?? null,
        content_version_id: payload.content_version_id ?? null,
        prev_snapshot: payload.prev_snapshot ?? null,
        next_snapshot: payload.next_snapshot ?? null,
        created_by: currentUserId,
      })
      .returning('id')
      .executeTakeFirstOrThrow()

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
      .where('cr.id', '=', inserted.id)
      .executeTakeFirstOrThrow()

    globalThis.logger?.info('Content revision created', {
      id: inserted.id,
      entity_type: payload.entity_type,
      timeMs: Date.now() - startedAt,
    })

    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to create content revision', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
