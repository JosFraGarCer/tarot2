// server/api/base_skills/[id].get.ts
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
      .selectFrom('base_skills as s')
      .leftJoin('users as u', 'u.id', 's.created_by')
      .leftJoin('base_skills_translations as t_req', (join) =>
        join.onRef('t_req.base_skill_id', '=', 's.id').on('t_req.language_code', '=', lang),
      )
      .leftJoin('base_skills_translations as t_en', (join) =>
        join.onRef('t_en.base_skill_id', '=', 's.id').on('t_en.language_code', '=', sql`'en'`),
      )
      .leftJoin('facet_translations as t_req_ft', (join) =>
        join.onRef('t_req_ft.facet_id', '=', 's.facet_id').on('t_req_ft.language_code', '=', lang),
      )
      .leftJoin('facet_translations as t_en_ft', (join) =>
        join.onRef('t_en_ft.facet_id', '=', 's.facet_id').on('t_en_ft.language_code', '=', sql`'en'`),
      )
      .select([
        's.id',
        's.code',
        's.facet_id',
        's.status',
        's.is_active',
        's.created_by',
        's.image',
        's.created_at',
        's.modified_at',
        sql`coalesce(t_req.name, t_en.name)`.as('name'),
        sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
        sql`coalesce(t_req.description, t_en.description)`.as('description'),
        sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
        sql`coalesce(t_req_ft.name, t_en_ft.name)`.as('facet'),
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
            where tl.entity_type = ${'skills'} and tl.entity_id = s.id
          )
        `.as('tags'),
      ])
      .where('s.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('Base skill not found')

    globalThis.logger?.info('Base skill fetched', { id, lang, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch base skill', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})

