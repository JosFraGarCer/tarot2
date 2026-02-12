// server/api/editorial/state.get.ts
import { defineEventHandler, createError } from 'h3'
import type { Kysely } from 'kysely'
import type { DB } from '../../database/types'
import { parseQuery } from '../../utils/parseQuery'
import { createResponse } from '../../utils/response'
import { editorialStateQuerySchema } from '@shared/schemas/editorial-state'
import { resolveEntityTypeId, isValidEntityCode } from '../../utils/entityTypes'

export default defineEventHandler(async (event) => {
  const db = globalThis.db as Kysely<DB>
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database not available' })

  const query = parseQuery(event, editorialStateQuerySchema, { scope: 'editorial.state.query' })

  if (!isValidEntityCode(query.entity_code)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid entity_code: ${query.entity_code}` })
  }

  const entityTypeId = await resolveEntityTypeId(db, query.entity_code)
  if (entityTypeId == null) {
    throw createError({ statusCode: 400, statusMessage: `Unknown entity_code: ${query.entity_code}` })
  }

  const row = await db
    .selectFrom('editorial_state')
    .selectAll()
    .where('entity_type', '=', entityTypeId)
    .where('entity_id', '=', query.entity_id)
    .executeTakeFirst()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Editorial state not found' })
  }

  return createResponse({
    id: row.id,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    status: row.status,
    is_active: row.is_active,
    content_version_id: row.content_version_id,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: String(row.created_at),
    modified_at: String(row.modified_at),
  })
})
