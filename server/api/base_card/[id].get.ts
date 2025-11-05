// server/api/base_card/[id].get.ts
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
      .selectFrom('base_card as c')
      .leftJoin('users as u', 'u.id', 'c.created_by')
      .leftJoin('base_card_translations as t_req', (join) =>
        join.onRef('t_req.card_id', '=', 'c.id').on('t_req.language_code', '=', lang),
      )
      .leftJoin('base_card_translations as t_en', (join) =>
        join.onRef('t_en.card_id', '=', 'c.id').on('t_en.language_code', '=', sql`'en'`),
      )
      .leftJoin('base_card_type_translations as t_req_ct', (join) =>
        join.onRef('t_req_ct.card_type_id', '=', 'c.card_type_id').on('t_req_ct.language_code', '=', lang),
      )
      .leftJoin('base_card_type_translations as t_en_ct', (join) =>
        join.onRef('t_en_ct.card_type_id', '=', 'c.card_type_id').on('t_en_ct.language_code', '=', sql`'en'`),
      )
      .select([
        'c.id',
        'c.code',
        'c.card_type_id',
        'c.status',
        'c.is_active',
        'c.created_by',
        'c.image',
        'c.created_at',
        'c.modified_at',
        sql`coalesce(t_req.name, t_en.name)`.as('name'),
        sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
        sql`coalesce(t_req.description, t_en.description)`.as('description'),
        sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
        sql`coalesce(t_req_ct.name, t_en_ct.name)`.as('card_type'),
        sql`u.username`.as('create_user'),
        sql`
          (
            select coalesce(json_agg(
              json_build_object(
                'id', tg.id,
                'name', coalesce(tt_req.name, tt_en.name),
                'language_code_resolved', coalesce(tt_req.language_code, 'en')
              )
            ), '[]'::json)
            from tag_links as tl
            join tags as tg on tg.id = tl.tag_id
            left join tags_translations as tt_req
              on tt_req.tag_id = tg.id and tt_req.language_code = ${lang}
            left join tags_translations as tt_en
              on tt_en.tag_id = tg.id and tt_en.language_code = 'en'
            where tl.entity_type = ${'base_card'} and tl.entity_id = c.id
          )
        `.as('tags'),
      ])
      .where('c.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('Base card not found')

    globalThis.logger?.info('Base card fetched', { id, lang, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch base card', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})

