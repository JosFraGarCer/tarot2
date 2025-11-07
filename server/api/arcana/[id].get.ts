// server/api/arcana/[id].get.ts
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
      .selectFrom('arcana as a')
      .leftJoin('arcana_translations as t_req', (join) =>
        join.onRef('t_req.arcana_id', '=', 'a.id').on('t_req.language_code', '=', lang),
      )
      .leftJoin('arcana_translations as t_en', (join) =>
        join.onRef('t_en.arcana_id', '=', 'a.id').on('t_en.language_code', '=', sql`'en'`),
      )
      .select([
        'a.id',
        'a.code',
        'a.status',
        'a.is_active',
        'a.created_by',
        'a.image',
        'a.created_at',
        'a.modified_at',
        sql`coalesce(t_req.name, t_en.name)`.as('name'),
        sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
        sql`coalesce(t_req.description, t_en.description)`.as('description'),
        sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
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
            where tl.entity_type = ${'arcana'} and tl.entity_id = a.id
          )
        `.as('tags'),
      ])
      .where('a.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('Arcana not found')

    globalThis.logger?.info('Arcana fetched', { id, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch arcana', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
