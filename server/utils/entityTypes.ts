// server/utils/entityTypes.ts
import type { Kysely } from 'kysely'
import type { DB } from '../database/types'

const VALID_ENTITY_CODES = [
  'arcana',
  'facet',
  'base_card',
  'base_card_type',
  'world',
  'world_card',
  'base_skills',
] as const

export type EntityCode = typeof VALID_ENTITY_CODES[number]

export function isValidEntityCode(code: string): code is EntityCode {
  return VALID_ENTITY_CODES.includes(code as EntityCode)
}

/**
 * Resolve an entity_type code (e.g. 'base_card') to its int2 ID from entity_types table.
 * Returns null if the code is not found.
 */
export async function resolveEntityTypeId(
  db: Kysely<DB>,
  code: string,
): Promise<number | null> {
  const row = await db
    .selectFrom('entity_types')
    .select('id')
    .where('code', '=', code)
    .executeTakeFirst()
  return row?.id ?? null
}
