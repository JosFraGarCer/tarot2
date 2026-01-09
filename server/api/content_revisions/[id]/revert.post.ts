// server/api/content_revisions/[id]/revert.post.ts
import { defineEventHandler, readBody } from 'h3'
import { sql } from 'kysely'
import { paramsSchema, contentRevisionRevertSchema } from '@shared/schemas/content-revision'

const DISALLOWED_FIELDS = new Set(['id', 'created_at', 'modified_at', 'updated_by', 'created_by'])

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  const logger = event.context.logger ?? globalThis.logger
  const requestId = event.context.requestId ?? null

  logger?.info?.({ scope: 'content_revisions.revert.start', requestId }, 'Content revision revert started')

  const user = (event.context as any).user
  const permissions = user?.permissions ?? {}
  const canRevert = permissions.canRevert ?? permissions.canPublish ?? permissions.canReview ?? false
  if (!canRevert) forbidden('Permission required to revert revisions')

  enforceRateLimit(event, {
    scope: 'content_revisions.revert.rate_limit',
    identifier: `${event.node.req.method}:content_revisions.revert`,
    max: 10,
    windowMs: 60_000,
  })

  const { id } = safeParseOrThrow(paramsSchema, event.context.params ?? {})
  const body = safeParseOrThrow(contentRevisionRevertSchema, await readBody(event))

  const revision = await globalThis.db
    .selectFrom('content_revisions')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()

  if (!revision) notFound('Content revision not found')

  const entityType = String((revision as any).entity_type ?? '')
  const entityId = Number((revision as any).entity_id)
  const snapshot = (revision as any).prev_snapshot as Record<string, any> | null

  if (!entityType || !Number.isFinite(entityId)) badRequest('Invalid entity reference')
  if (!snapshot || typeof snapshot !== 'object') badRequest('No prev_snapshot available to revert')

  const patch: Record<string, any> = {}
  for (const [key, value] of Object.entries(snapshot)) {
    if (!DISALLOWED_FIELDS.has(key)) {
      patch[key] = value
    }
  }

  let newRevisionId: number | null = null

  await globalThis.db.transaction().execute(async (trx) => {
    const entityExists = await trx
      .selectFrom(sql`${sql.ref(entityType)}`)
      .select(sql`1`.as('one'))
      .where(sql`id`, '=', entityId)
      .executeTakeFirst()

    if (!entityExists) notFound('Target entity not found for revert')

    const updatePayload = {
      ...patch,
      ...(user?.id ? { updated_by: user.id } : {}),
    }

    await trx
      .updateTable(sql`${sql.ref(entityType)}`)
      .set(updatePayload)
      .where(sql`id`, '=', entityId)
      .execute()

    const maxVersionRow = await trx
      .selectFrom('content_revisions')
      .select([sql`max(version_number)`.as('vmax')])
      .where('entity_type', '=', entityType)
      .where('entity_id', '=', entityId)
      .executeTakeFirst()

    const nextVersion = Number((maxVersionRow as any)?.vmax ?? 0) + 1

    const inserted = await trx
      .insertInto('content_revisions')
      .values({
        entity_type: entityType,
        entity_id: entityId,
        version_number: nextVersion,
        status: 'reverted',
        language_code: (revision as any).language_code ?? null,
        diff: { reverted_from_revision_id: id },
        notes: body.notes ?? `Reverted from revision ${id}`,
        prev_snapshot: null,
        next_snapshot: (revision as any).next_snapshot ?? null,
        content_version_id: (revision as any).content_version_id ?? null,
        created_by: user?.id ?? null,
      })
      .returning('id')
      .executeTakeFirst()

    newRevisionId = Number(inserted?.id ?? 0)
  })

  logger?.info?.(
    {
      scope: 'content_revisions.revert.end',
      requestId,
      revision_id: id,
      entity_type: entityType,
      entity_id: entityId,
      reverted_to_revision_id: newRevisionId,
      user_id: user?.id ?? null,
      timeMs: Date.now() - startedAt,
    },
    'Content revision revert completed',
  )

  return createResponse({
    revision_id: id,
    reverted_to_revision_id: newRevisionId,
    entity_type: entityType,
    entity_id: entityId,
  })
})
