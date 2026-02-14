// server/utils/revisionSequence.ts
import { sql, type Kysely, type Transaction } from 'kysely'
import type { DB } from '../database/types'

export type DbExecutor = Kysely<DB> | Transaction<DB>

/**
 * Allocates the next revision version number under a transaction-scoped advisory lock.
 * This prevents concurrent writers from generating duplicate version_number values.
 */
export async function nextRevisionVersion(
  db: DbExecutor,
  entityType: string,
  entityId: number,
): Promise<number> {
  await sql`select pg_advisory_xact_lock(hashtext(${entityType}), ${entityId})`.execute(db)

  const maxVersionRow = await db
    .selectFrom('content_revisions')
    .select(sql<number>`coalesce(max(version_number), 0)`.as('vmax'))
    .where('entity_type', '=', entityType)
    .where('entity_id', '=', entityId)
    .executeTakeFirst()

  return Number(maxVersionRow?.vmax ?? 0) + 1
}
