// server/api/translations/state.get.ts
import { defineEventHandler, createError } from 'h3'
import type { Kysely } from 'kysely'
import type { DB } from '../../database/types'
import { parseQuery } from '../../utils/parseQuery'
import { createResponse } from '../../utils/response'
import { translationStateQuerySchema } from '@shared/schemas/translation-state'
import { resolveEntityTypeId, isValidEntityCode } from '../../utils/entityTypes'

export default defineEventHandler(async (event) => {
  const db = globalThis.db as Kysely<DB>
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database not available' })

  const query = parseQuery(event, translationStateQuerySchema, { scope: 'translations.state.query' })

  if (!isValidEntityCode(query.entity_code)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid entity_code: ${query.entity_code}` })
  }

  const entityTypeId = await resolveEntityTypeId(db, query.entity_code)
  if (entityTypeId == null) {
    throw createError({ statusCode: 400, statusMessage: `Unknown entity_code: ${query.entity_code}` })
  }

  const row = await db
    .selectFrom('translation_state')
    .selectAll()
    .where('entity_type', '=', entityTypeId)
    .where('entity_id', '=', query.entity_id)
    .where('language_code', '=', query.language_code)
    .executeTakeFirst()

  // Absence = missing translation — return null, never throw
  if (!row) {
    return createResponse(null)
  }

  return createResponse({
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    language_code: row.language_code,
    status: row.status,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    created_by: row.created_by,
    updated_by: row.updated_by,
  })
})
