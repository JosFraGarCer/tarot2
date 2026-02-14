// server/utils/editorialTransitionService.ts
import { createError } from 'h3'
import { sql, type Kysely, type Transaction } from 'kysely'
import type { DB } from '../database/types'
import { canTransition, type EditorialContext, type EditorialUserContext } from '@shared/editorial/guard'
import type { CardStatus } from '@shared/editorial/card-status'
import type { AuthenticatedUser } from '@shared/schemas/common'
import { resolveEntityTypeId } from './entityTypes'
import { nextRevisionVersion } from './revisionSequence'

export type MutationExecutor = Kysely<DB> | Transaction<DB>

export interface TransitionRequest {
  db: MutationExecutor
  baseTable: keyof DB
  idColumn: string
  entityCode: string
  entityId: number
  requestedStatus: CardStatus
  user: AuthenticatedUser | null
  userCtx: EditorialUserContext | null
  editorialCtx: EditorialContext
  logger?: {
    info?: (obj: Record<string, unknown>, msg?: string) => void
    warn?: (obj: Record<string, unknown>, msg?: string) => void
  }
  notes?: string
}

export interface TransitionResult {
  changed: boolean
  fromStatus: CardStatus
  toStatus: CardStatus
  prevSnapshot: Record<string, unknown>
  nextSnapshot: Record<string, unknown>
  revisionNumber: number
}

export async function applyEditorialTransition(request: TransitionRequest): Promise<TransitionResult | null> {
  const {
    db,
    baseTable,
    idColumn,
    entityCode,
    entityId,
    requestedStatus,
    user,
    userCtx,
    editorialCtx,
    logger,
    notes,
  } = request

  const currentRow = await db
    .selectFrom(baseTable)
    .selectAll()
    .where(sql.ref(idColumn), '=', entityId)
    .executeTakeFirst()

  if (!currentRow) {
    throw createError({ statusCode: 404, statusMessage: `${entityCode} not found` })
  }

  const fromStatus = String((currentRow as Record<string, unknown>).status ?? '') as CardStatus
  const toStatus = requestedStatus

  if (!fromStatus) {
    throw createError({ statusCode: 400, statusMessage: 'Current status is missing' })
  }

  if (fromStatus === toStatus) {
    return null
  }

  const guard = canTransition(fromStatus, toStatus, editorialCtx, userCtx)
  if (!guard.allowed) {
    const statusCode = guard.code === 'PERMISSION_DENIED' ? 403 : 400
    logger?.warn?.(
      {
        scope: 'editorial.transition.rejected',
        entityCode,
        entityId,
        fromStatus,
        toStatus,
        reason: guard.reason,
        code: guard.code,
      },
      'Editorial transition rejected',
    )

    throw createError({
      statusCode,
      statusMessage: `Status transition not allowed: ${fromStatus} -> ${toStatus}. ${guard.reason ?? ''}`.trim(),
    })
  }

  const entityTypeId = await resolveEntityTypeId(db as Kysely<DB>, entityCode)
  if (entityTypeId == null) {
    throw createError({ statusCode: 500, statusMessage: `Missing entity type mapping for ${entityCode}` })
  }

  await db
    .insertInto('editorial_audit_log')
    .values({
      entity_type: entityTypeId,
      entity_id: entityId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: user?.id ?? null,
    })
    .execute()

  await db
    .updateTable(baseTable)
    .set({
      status: toStatus,
      updated_by: user?.id ?? null,
    })
    .where(sql.ref(idColumn), '=', entityId)
    .execute()

  const nextSnapshot = await db
    .selectFrom(baseTable)
    .selectAll()
    .where(sql.ref(idColumn), '=', entityId)
    .executeTakeFirst()

  const revisionNumber = await nextRevisionVersion(db, entityCode, entityId)

  await db
    .insertInto('content_revisions')
    .values({
      entity_type: entityCode,
      entity_id: entityId,
      version_number: revisionNumber,
      status: toStatus,
      diff: sql`${JSON.stringify({ status: { old: fromStatus, new: toStatus } })}::jsonb`,
      notes: notes ?? `Status transition: ${fromStatus} -> ${toStatus}`,
      prev_snapshot: sql`${JSON.stringify(currentRow)}::jsonb`,
      next_snapshot: sql`${JSON.stringify(nextSnapshot ?? null)}::jsonb`,
      created_by: user?.id ?? null,
    })
    .execute()

  logger?.info?.(
    {
      scope: 'editorial.transition.applied',
      entityCode,
      entityId,
      fromStatus,
      toStatus,
      revisionNumber,
    },
    'Editorial transition committed',
  )

  return {
    changed: true,
    fromStatus,
    toStatus,
    prevSnapshot: currentRow as Record<string, unknown>,
    nextSnapshot: (nextSnapshot ?? {}) as Record<string, unknown>,
    revisionNumber,
  }
}
