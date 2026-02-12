// server/utils/editorialStateLoader.ts
// Read-only helpers for editorial_state and translation_state.
// Write helpers live in editorialStateSync.ts.
import type { Kysely } from 'kysely'
import type { DB } from '../database/types'
import { resolveEntityTypeId } from './entityTypes'

export interface EditorialStateEnvelope {
  id: number
  entity_type: number
  entity_id: number
  status: string
  is_active: boolean
  content_version_id: number | null
  created_by: number | null
  updated_by: number | null
  created_at: string
  modified_at: string
}

/**
 * Fetch editorial_state for a single entity.
 * Returns null if no editorial_state row exists.
 */
export async function fetchEditorialState(
  db: Kysely<DB>,
  entityCode: string,
  entityId: number,
): Promise<EditorialStateEnvelope | null> {
  const entityTypeId = await resolveEntityTypeId(db, entityCode)
  if (entityTypeId == null) return null

  const row = await db
    .selectFrom('editorial_state')
    .selectAll()
    .where('entity_type', '=', entityTypeId)
    .where('entity_id', '=', entityId)
    .executeTakeFirst()

  if (!row) return null

  return {
    id: row.id as number,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    status: row.status as string,
    is_active: row.is_active as boolean,
    content_version_id: row.content_version_id,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: String(row.created_at),
    modified_at: String(row.modified_at),
  }
}

/**
 * Batch-fetch editorial_state for multiple entity IDs of the same type.
 * Returns a Map<entity_id, EditorialStateEnvelope>.
 */
export async function fetchEditorialStateBatch(
  db: Kysely<DB>,
  entityCode: string,
  entityIds: number[],
): Promise<Map<number, EditorialStateEnvelope>> {
  const result = new Map<number, EditorialStateEnvelope>()
  if (entityIds.length === 0) return result

  const entityTypeId = await resolveEntityTypeId(db, entityCode)
  if (entityTypeId == null) return result

  const rows = await db
    .selectFrom('editorial_state')
    .selectAll()
    .where('entity_type', '=', entityTypeId)
    .where('entity_id', 'in', entityIds)
    .execute()

  for (const row of rows) {
    result.set(row.entity_id, {
      id: row.id as number,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      status: row.status as string,
      is_active: row.is_active as boolean,
      content_version_id: row.content_version_id,
      created_by: row.created_by,
      updated_by: row.updated_by,
      created_at: String(row.created_at),
      modified_at: String(row.modified_at),
    })
  }

  return result
}

/**
 * Fetch translation_state for a single entity + language.
 * Returns null if no row exists (= missing translation).
 */
export async function fetchTranslationState(
  db: Kysely<DB>,
  entityCode: string,
  entityId: number,
  languageCode: string,
): Promise<{
  entity_type: number
  entity_id: number
  language_code: string
  status: string
  created_at: string
  updated_at: string
  created_by: number | null
  updated_by: number | null
} | null> {
  const entityTypeId = await resolveEntityTypeId(db, entityCode)
  if (entityTypeId == null) return null

  const row = await db
    .selectFrom('translation_state')
    .selectAll()
    .where('entity_type', '=', entityTypeId)
    .where('entity_id', '=', entityId)
    .where('language_code', '=', languageCode)
    .executeTakeFirst()

  if (!row) return null

  return {
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    language_code: row.language_code,
    status: row.status as string,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    created_by: row.created_by,
    updated_by: row.updated_by,
  }
}
