// server/api/world_card/[id].get.ts
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
      .selectFrom('world_card as wc')
      .leftJoin('users as u', 'u.id', 'wc.created_by')
      .leftJoin('world_card_translations as t_req', (join) =>
        join.onRef('t_req.card_id', '=', 'wc.id').on('t_req.language_code', '=', lang),
      )
      .leftJoin('world_card_translations as t_en', (join) =>
        join.onRef('t_en.card_id', '=', 'wc.id').on('t_en.language_code', '=', sql`'en'`),
      )
      .select([
        'wc.id',
        'wc.code',
        'wc.world_id',
        'wc.base_card_id',
        'wc.is_override',
        'wc.status',
        'wc.is_active',
        'wc.created_by',
        'wc.image',
        'wc.created_at',
        'wc.modified_at',
        sql`coalesce(t_req.name, t_en.name)`.as('name'),
        sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
        sql`coalesce(t_req.description, t_en.description)`.as('description'),
        sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
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
            where tl.entity_type = ${'world_card'} and tl.entity_id = wc.id
          )
        `.as('tags'),
      ])
      .where('wc.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('World card not found')

    globalThis.logger?.info('World card fetched', { id, lang, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch world card', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})

