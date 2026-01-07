import { defineEventHandler, readValidatedBody, getValidatedQuery } from 'h3'
import { sql } from 'kysely'
import { z } from 'zod'
import { badRequest, forbidden, notFound } from '../../../utils/error'
import { createResponse } from '../../../utils/response'
import { contentRevisionRevertSchema } from '../../../schemas/content-revision'
import { enforceRateLimit } from '../../../utils/rateLimit'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const DISALLOWED_FIELDS = new Set(['id', 'created_at', 'modified_at', 'updated_by', 'created_by'])

// User context type
interface UserContext {
  id?: number
  permissions?: Record<string, boolean>
}

// Revision row type from database
interface RevisionRow {
  id: number
  entity_type: string
  entity_id: number
  version_number: number
  language_code: string | null
  prev_snapshot: Record<string, unknown> | null
  next_snapshot: Record<string, unknown> | null
  content_version_id: number | null
}

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  const logger = event.context.logger ?? globalThis.logger
  const requestId = event.context.requestId ?? null

  logger?.info?.({ scope: 'content_revisions.revert.start', requestId }, 'Content revision revert started')

  const user = event.context.user as UserContext | undefined
  const permissions = user?.permissions ?? {}
  const canRevert = permissions.canRevert ?? permissions.canPublish ?? permissions.canReview ?? false
  if (!canRevert) forbidden('Permission required to revert revisions')

  enforceRateLimit(event, {
    scope: 'content_revisions.revert.rate_limit',
    identifier: `${event.node.req.method}:content_revisions.revert`,
    max: 10,
    windowMs: 60_000,
  })

  const { id } = await getValidatedQuery(event, paramsSchema.parse)
  const body = await readValidatedBody(event, contentRevisionRevertSchema.parse)

  const revision = await globalThis.db
    .selectFrom('content_revisions')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()

  if (!revision) notFound('Content revision not found')

  const rev = revision as RevisionRow
  const entityType = String(rev.entity_type ?? '')
  const entityId = Number(rev.entity_id)
  const snapshot = rev.prev_snapshot

  if (!entityType || !Number.isFinite(entityId)) badRequest('Invalid entity reference')
  if (!snapshot || typeof snapshot !== 'object') badRequest('No prev_snapshot available to revert')

  const patch: Record<string, unknown> = {}
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

    const nextVersion = Number((maxVersionRow as { vmax?: number } | undefined)?.vmax ?? 0) + 1

    const inserted = await trx
      .insertInto('content_revisions')
      .values({
        entity_type: entityType,
        entity_id: entityId,
        version_number: nextVersion,
        status: 'reverted',
        language_code: rev.language_code ?? null,
        diff: { reverted_from_revision_id: id },
        notes: body.notes ?? `Reverted from revision ${id}`,
        prev_snapshot: null,
        next_snapshot: rev.next_snapshot ?? null,
        content_version_id: rev.content_version_id ?? null,
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
