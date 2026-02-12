// server/utils/editorialStateSync.ts
import type { Kysely, Transaction } from 'kysely'
import type { DB } from '../database/types'
import { resolveEntityTypeId } from './entityTypes'

/**
 * Delete the editorial_state row for an entity.
 * Idempotent — safe to call even if no row exists.
 * Call ONLY when the base entity is deleted (not on translation-only deletes).
 */
export async function deleteEditorialState(
  db: Kysely<DB> | Transaction<DB>,
  entityCode: string,
  entityId: number,
): Promise<void> {
  const entityTypeId = await resolveEntityTypeId(db as Kysely<DB>, entityCode)
  if (entityTypeId == null) return

  await (db as any)
    .deleteFrom('editorial_state')
    .where('entity_type', '=', entityTypeId)
    .where('entity_id', '=', entityId)
    .execute()
}

export async function upsertEditorialState(
  db: Kysely<DB> | Transaction<DB>,
  entityCode: string,
  entityId: number,
  opts?: {
    status?: string
    isActive?: boolean
    contentVersionId?: number | null
    createdBy?: number | null
    updatedBy?: number | null
  },
): Promise<void> {
  const entityTypeId = await resolveEntityTypeId(db as Kysely<DB>, entityCode)
  if (entityTypeId == null) return

  await (db as any)
    .insertInto('editorial_state')
    .values({
      entity_type: entityTypeId,
      entity_id: entityId,
      status: opts?.status ?? 'draft',
      is_active: opts?.isActive ?? true,
      content_version_id: opts?.contentVersionId ?? null,
      created_by: opts?.createdBy ?? null,
      updated_by: opts?.updatedBy ?? null,
    })
    .onConflict((oc: any) =>
      oc.columns(['entity_type', 'entity_id']).doNothing()
    )
    .execute()
}
