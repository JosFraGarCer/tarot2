// server/api/facet/[id].get.ts
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
      .selectFrom('facet as f')
      .leftJoin('users as u', 'u.id', 'f.created_by')
      .leftJoin('facet_translations as t_req', (join) =>
        join.onRef('t_req.facet_id', '=', 'f.id').on('t_req.language_code', '=', lang),
      )
      .leftJoin('facet_translations as t_en', (join) =>
        join.onRef('t_en.facet_id', '=', 'f.id').on('t_en.language_code', '=', sql`'en'`),
      )
      .leftJoin('arcana_translations as t_req_ar', (join) =>
        join.onRef('t_req_ar.arcana_id', '=', 'f.arcana_id').on('t_req_ar.language_code', '=', lang),
      )
      .leftJoin('arcana_translations as t_en_ar', (join) =>
        join.onRef('t_en_ar.arcana_id', '=', 'f.arcana_id').on('t_en_ar.language_code', '=', sql`'en'`),
      )
      .select([
        'f.id',
        'f.code',
        'f.arcana_id',
        'f.status',
        'f.is_active',
        'f.created_by',
        'f.created_at',
        'f.modified_at',
        sql`coalesce(t_req.name, t_en.name)`.as('name'),
        sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
        sql`coalesce(t_req.description, t_en.description)`.as('description'),
        sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
        sql`coalesce(t_req_ar.name, t_en_ar.name)`.as('arcana'),
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
            where tl.entity_type = ${'facet'} and tl.entity_id = f.id
          )
        `.as('tags'),
      ])
      .where('f.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('Facet not found')

    globalThis.logger?.info('Facet fetched', { id, lang, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch facet', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})

