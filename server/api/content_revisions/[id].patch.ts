// server/api/content_revisions/[id].patch.ts
import { defineEventHandler, readValidatedBody } from "h3"
import { sql } from 'kysely'
import { readValidatedBody } from "h3"
import { createResponse } from '../../utils/response'
import { contentRevisionUpdateSchema } from '../../schemas/content-revision'
import { badRequest, notFound, conflict } from '../../utils/error'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const idParam = event.context.params?.id
    const id = Number(idParam)
    if (!Number.isFinite(id)) badRequest('Invalid id')

    const raw = await readBody(event)
    const payload = await readValidatedBody(event, contentRevisionUpdateSchema.parse)

    const existing = await globalThis.db
      .selectFrom('content_revisions')
      .select(['entity_type', 'entity_id', 'version_number'])
      .where('id', '=', id)
      .executeTakeFirst()

    if (!existing) notFound('Content revision not found')

    const patch: Record<string, unknown> = {}

    if (payload.version_number !== undefined) {
      if (payload.version_number !== existing.version_number) {
        const duplicated = await globalThis.db
          .selectFrom('content_revisions')
          .select('id')
          .where('entity_type', '=', existing.entity_type)
          .where('entity_id', '=', existing.entity_id)
          .where('version_number', '=', payload.version_number)
          .where('id', '!=', id)
          .executeTakeFirst()

        if (duplicated) conflict('version_number already exists for this entity')
      }
      patch.version_number = payload.version_number
    }

    if (payload.status !== undefined) patch.status = payload.status
    if (payload.language_code !== undefined) patch.language_code = payload.language_code ?? null
    if (payload.content_version_id !== undefined) patch.content_version_id = payload.content_version_id ?? null
    if (payload.notes !== undefined) patch.notes = payload.notes ?? null
    if (payload.diff !== undefined) patch.diff = payload.diff ?? {}
    if (payload.prev_snapshot !== undefined) patch.prev_snapshot = payload.prev_snapshot ?? null
    if (payload.next_snapshot !== undefined) patch.next_snapshot = payload.next_snapshot ?? null

    if (Object.keys(patch).length > 0) {
      const updated = await globalThis.db
        .updateTable('content_revisions')
        .set(patch)
        .where('id', '=', id)
        .returning('id')
        .executeTakeFirst()

      if (!updated) notFound('Content revision not found')
    }

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
      .executeTakeFirstOrThrow()

    globalThis.logger?.info('Content revision updated', {
      id,
      timeMs: Date.now() - startedAt,
    })

    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to update content revision', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
