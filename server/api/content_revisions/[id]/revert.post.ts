// server/api/content_revisions/[id]/revert.post.ts
import { defineEventHandler } from 'h3'
import { sql } from 'kysely'
import { badRequest, notFound } from '../../../utils/error'
import { createResponse } from '../../../utils/response'

const DISALLOWED_FIELDS = new Set(['id', 'created_at', 'modified_at', 'updated_by', 'created_by'])

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  const idParam = event.context.params?.id
  const id = Number(idParam)
  if (!Number.isFinite(id)) badRequest('Invalid id')

  const rev = await globalThis.db
    .selectFrom('content_revisions')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()

  if (!rev) notFound('Content revision not found')

  const entityType = (rev as any).entity_type as string
  const entityId = Number((rev as any).entity_id)
  const snapshot = (rev as any).prev_snapshot as Record<string, any> | null

  if (!entityType || !Number.isFinite(entityId)) badRequest('Invalid entity reference')
  if (!snapshot || typeof snapshot !== 'object') badRequest('No prev_snapshot available to revert')

  const patch: Record<string, any> = {}
  for (const [k, v] of Object.entries(snapshot)) {
    if (!DISALLOWED_FIELDS.has(k)) patch[k] = v
  }

  let createdRevisionId: number | null = null

  await globalThis.db.transaction().execute(async (trx) => {
    // Apply snapshot to base entity table
    await trx
      .updateTable(sql`${sql.ref(entityType)}`)
      .set(patch)
      .where('id', '=', entityId)
      .execute()

    // Determine next version number for this entity
    const maxRow = await trx
      .selectFrom('content_revisions')
      .select([sql`max(version_number)`.as('vmax')])
      .where('entity_type', '=', entityType)
      .where('entity_id', '=', entityId)
      .executeTakeFirst()
    const nextVersion = Number((maxRow as any)?.vmax || 0) + 1

    // Create a new revision to record the revert action as published
    const inserted = await trx
      .insertInto('content_revisions')
      .values({
        entity_type: entityType,
        entity_id: entityId,
        version_number: nextVersion,
        status: 'published',
        language_code: (rev as any).language_code ?? null,
        diff: {},
        notes: `revert from revision ${id}`,
        prev_snapshot: null,
        next_snapshot: null,
        content_version_id: (rev as any).content_version_id ?? null,
        created_by: (event.context as any).user?.id ?? null,
      })
      .returning('id')
      .executeTakeFirst()

    createdRevisionId = Number(inserted?.id || 0)
  })

  globalThis.logger?.info('Content revision reverted', {
    id,
    entity_type: (rev as any).entity_type,
    entity_id: (rev as any).entity_id,
    new_revision_id: createdRevisionId,
    timeMs: Date.now() - startedAt,
  })

  return createResponse({ revertedFrom: id, entity_type: entityType, entity_id: entityId, new_revision_id: createdRevisionId }, null)
})
