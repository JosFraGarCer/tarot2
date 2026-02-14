// server/api/content_revisions/[id]/revert.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'kysely'
import type { CardStatus } from '@shared/editorial/card-status'
import { paramsSchema, contentRevisionRevertSchema } from '@shared/schemas/content-revision'
import type { AuthenticatedUser } from '@shared/schemas/common'
import { safeParseOrThrow } from '../../../utils/validate'
import { createResponse } from '../../../utils/response'
import { badRequest, forbidden, notFound } from '../../../utils/error'
import { enforceRateLimit } from '../../../utils/rateLimit'
import { applyEditorialTransition } from '../../../utils/editorialTransitionService'
import { nextRevisionVersion } from '../../../utils/revisionSequence'
import { upsertEditorialState } from '../../../utils/editorialStateSync'

const REVERTIBLE_ENTITIES = ['arcana', 'base_card', 'world', 'world_card', 'facet', 'base_skills'] as const
type RevertibleEntityType = (typeof REVERTIBLE_ENTITIES)[number]
const REVERTIBLE_ENTITIES_SET = new Set<string>(REVERTIBLE_ENTITIES)
const DISALLOWED_FIELDS = new Set(['id', 'created_at', 'modified_at', 'updated_by', 'created_by'])

function validateEntityType(type: string): RevertibleEntityType {
  if (!REVERTIBLE_ENTITIES_SET.has(type)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid entity type: ${type}` })
  }
  return type as RevertibleEntityType
}

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  const logger = event.context.logger ?? globalThis.logger
  const requestId = event.context.requestId ?? null

  logger?.info?.({ scope: 'content_revisions.revert.start', requestId }, 'Content revision revert started')

  const user = ((event.context as Record<string, unknown>).user ?? null) as AuthenticatedUser | null
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

  const entityType = validateEntityType(String((revision as Record<string, unknown>).entity_type ?? ''))
  const entityId = Number((revision as Record<string, unknown>).entity_id)
  const snapshot = (revision as Record<string, unknown>).prev_snapshot as Record<string, unknown> | null

  if (!entityType || !Number.isFinite(entityId)) badRequest('Invalid entity reference')
  if (!snapshot || typeof snapshot !== 'object') badRequest('No prev_snapshot available to revert')
  const snapshotData = snapshot as Record<string, unknown>

  const targetStatusRaw = snapshotData.status
  if (typeof targetStatusRaw !== 'string') badRequest('Snapshot status is missing')
  const targetStatus = targetStatusRaw as CardStatus

  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(snapshotData)) {
    if (!DISALLOWED_FIELDS.has(key) && key !== 'status') {
      patch[key] = value
    }
  }

  let newRevisionId: number | null = null

  await globalThis.db.transaction().execute(async (trx) => {
    const currentRow = await trx
      .selectFrom(entityType)
      .selectAll()
      .where('id', '=', entityId)
      .executeTakeFirst()

    if (!currentRow) notFound('Target entity not found for revert')

    const currentStatus = String((currentRow as Record<string, unknown>).status ?? '') as CardStatus

    if (Object.keys(patch).length > 0) {
      const updatePayload: Record<string, unknown> = {
        ...patch,
        updated_by: user?.id ?? null,
      }

      await trx
        .updateTable(entityType)
        .set(updatePayload as never)
        .where('id', '=', entityId)
        .execute()
    }

    if (currentStatus !== targetStatus) {
      await applyEditorialTransition({
        db: trx,
        baseTable: entityType,
        idColumn: 'id',
        entityCode: entityType,
        entityId,
        requestedStatus: targetStatus,
        user,
        userCtx: {
          roles: user?.roles?.map((role) => role.name) ?? [],
          permissions,
        },
        editorialCtx: {
          hasBaseContent: true,
          hasAtLeastOneTranslation: true,
          hasEffectsDefined: true,
        },
        logger,
        notes: body.notes ?? `Reverted from revision ${id}`,
      })
    }

    const nextRow = await trx
      .selectFrom(entityType)
      .selectAll()
      .where('id', '=', entityId)
      .executeTakeFirst()

    const nextVersion = await nextRevisionVersion(trx, entityType, entityId)

    const inserted = await trx
      .insertInto('content_revisions')
      .values({
        entity_type: entityType,
        entity_id: entityId,
        version_number: nextVersion,
        status: targetStatus,
        language_code: (revision as Record<string, unknown>).language_code as string | null,
        diff: sql`${JSON.stringify({ reverted_from_revision_id: id })}::jsonb`,
        notes: body.notes ?? `Reverted from revision ${id}`,
        prev_snapshot: sql`${JSON.stringify(currentRow)}::jsonb`,
        next_snapshot: sql`${JSON.stringify(nextRow ?? null)}::jsonb`,
        content_version_id: (revision as Record<string, unknown>).content_version_id as number | null,
        created_by: user?.id ?? null,
      })
      .returning('id')
      .executeTakeFirst()

    newRevisionId = Number(inserted?.id ?? 0)

    const nextIsActive =
      typeof (nextRow as Record<string, unknown> | undefined)?.is_active === 'boolean'
        ? Boolean((nextRow as Record<string, unknown>).is_active)
        : true

    await upsertEditorialState(trx, entityType, entityId, {
      status: targetStatus,
      isActive: nextIsActive,
      updatedBy: user?.id ?? null,
    })
  })

  if (newRevisionId === null) {
    throw createError({ statusCode: 500, statusMessage: 'Revert transaction failed: new revision ID not generated' })
  }

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
