// server/api/base_card_type/[id].get.ts
import { defineEventHandler, getQuery } from 'h3'
import { notFound } from '../../utils/error'
import { createResponse } from '../../utils/response'
import { getRequestedLanguage } from '../../utils/i18n'
import { sql } from 'kysely'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const id = Number(event.context.params?.id)
    const q = getQuery(event)
    const lang = getRequestedLanguage(q)

    const row = await globalThis.db
      .selectFrom('base_card_type as ct')
      .leftJoin('base_card_type_translations as t_req', (join) =>
        join.onRef('t_req.card_type_id', '=', 'ct.id').on('t_req.language_code', '=', lang),
      )
      .leftJoin('base_card_type_translations as t_en', (join) =>
        join.onRef('t_en.card_type_id', '=', 'ct.id').on('t_en.language_code', '=', sql`'en'`),
      )
      .select([
        'ct.id',
        'ct.code',
        'ct.status',
        'ct.is_active',
        'ct.created_by',
        'ct.image',
        'ct.created_at',
        'ct.modified_at',
        sql`coalesce(t_req.name, t_en.name)`.as('name'),
        sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
        sql`coalesce(t_req.description, t_en.description)`.as('description'),
        sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
      ])
      .where('ct.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('Card type not found')

    globalThis.logger?.info('Card type fetched', { id, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch card type', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
