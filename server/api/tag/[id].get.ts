// server/api/tag/[id].get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'kysely'
import { parseQuery } from '../../utils/parseQuery'
import { createResponse } from '../../utils/response'
import { getRequestedLanguage } from '../../utils/i18n'
import { markLanguageFallback } from '../../utils/language'
import { tagLangQuerySchema } from '@shared/schemas/entities/tag'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  const logger = event.context.logger ?? globalThis.logger
  try {
    const query = parseQuery(event, tagLangQuerySchema, { scope: 'tag.detail.query' })
    const lang = getRequestedLanguage(query)
    const idParam = event.context.params?.id
    const id = Number(idParam)
    if (!Number.isFinite(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

    const row = await globalThis.db
      .selectFrom('tags as t')
      .leftJoin('tags_translations as t_req', (join) =>
        join.onRef('t_req.tag_id', '=', 't.id').on('t_req.language_code', '=', lang),
      )
      .leftJoin('tags_translations as t_en', (join) =>
        join.onRef('t_en.tag_id', '=', 't.id').on('t_en.language_code', '=', sql`'en'`),
      )
      .leftJoin('tags as tp', 'tp.id', 't.parent_id')
      .leftJoin('tags_translations as tp_req', (join) =>
        join.onRef('tp_req.tag_id', '=', 'tp.id').on('tp_req.language_code', '=', lang),
      )
      .leftJoin('tags_translations as tp_en', (join) =>
        join.onRef('tp_en.tag_id', '=', 'tp.id').on('tp_en.language_code', '=', sql`'en'`),
      )
      .select([
        't.id',
        't.code',
        't.category',
        't.parent_id',
        't.sort',
        't.is_active',
        't.created_by',
        't.created_at',
        't.modified_at',
        sql`coalesce(t_req.name, t_en.name)`.as('name'),
        sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
        sql`coalesce(t_req.description, t_en.description)`.as('description'),
        sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
        sql`coalesce(tp_req.name, tp_en.name)`.as('parent_name'),
      ])
      .where('t.id', '=', id)
      .executeTakeFirst()

    if (!row) throw createError({ statusCode: 404, statusMessage: 'Tag not found' })

    logger?.info?.({ scope: 'tag.detail', id, lang, timeMs: Date.now() - startedAt }, 'Tag fetched')
    return createResponse(markLanguageFallback(row, lang), { lang })
  } catch (error) {
    logger?.error?.(
      {
        scope: 'tag.detail',
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to fetch tag',
    )
    throw error
  }
})
