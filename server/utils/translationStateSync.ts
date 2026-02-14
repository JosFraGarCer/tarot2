// server/utils/translationStateSync.ts
import type { Kysely, Transaction } from 'kysely'
import type { DB } from '../database/types'
import { resolveEntityTypeId } from './entityTypes'

/**
 * Upsert a translation_state row when a translation is created or updated.
 * If the row already exists, only updated_at and updated_by are refreshed.
 * New rows get status='draft' by default.
 */
export async function upsertTranslationState(
  db: Kysely<DB> | Transaction<DB>,
  entityCode: string,
  entityId: number,
  languageCode: string,
  userId: number | null,
): Promise<void> {
  const entityTypeId = await resolveEntityTypeId(db as Kysely<DB>, entityCode)
  if (entityTypeId == null) return

  await db
    .insertInto('translation_state')
    .values({
      entity_type: entityTypeId,
      entity_id: entityId,
      language_code: languageCode,
      status: 'draft',
      created_by: userId,
      updated_by: userId,
    })
    .onConflict((oc) =>
      oc.columns(['entity_type', 'entity_id', 'language_code']).doUpdateSet({
        updated_by: userId,
        updated_at: new Date(),
      } as never)
    )
    .execute()
}

/**
 * Delete a translation_state row when a translation is removed.
 * Safe to call even if the row doesn't exist.
 */
export async function deleteTranslationState(
  db: Kysely<DB> | Transaction<DB>,
  entityCode: string,
  entityId: number,
  languageCode: string,
): Promise<void> {
  const entityTypeId = await resolveEntityTypeId(db as Kysely<DB>, entityCode)
  if (entityTypeId == null) return

  await db
    .deleteFrom('translation_state')
    .where('entity_type', '=', entityTypeId)
    .where('entity_id', '=', entityId)
    .where('language_code', '=', languageCode)
    .execute()
}

/**
 * Delete all translation_state rows for a given entity (when the base entity is deleted).
 * Safe to call even if no rows exist.
 */
export async function deleteAllTranslationStates(
  db: Kysely<DB> | Transaction<DB>,
  entityCode: string,
  entityId: number,
): Promise<void> {
  const entityTypeId = await resolveEntityTypeId(db as Kysely<DB>, entityCode)
  if (entityTypeId == null) return

  await db
    .deleteFrom('translation_state')
    .where('entity_type', '=', entityTypeId)
    .where('entity_id', '=', entityId)
    .execute()
}
