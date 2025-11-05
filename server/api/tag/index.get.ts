// server/api/tag/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'kysely'
import { safeParseOrThrow } from '../../utils/validate'
import { createPaginatedResponse } from '../../utils/response'
import { buildFilters } from '../../utils/filters'
import { getRequestedLanguage } from '../../utils/i18n'
import { tagQuerySchema } from '../../schemas/tag'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const q = getQuery(event)
    const { page, pageSize, q: search, search: search2, is_active, category, parent_id } = safeParseOrThrow(
      tagQuerySchema,
      q,
    )
    const lang = getRequestedLanguage(q)

    let base = globalThis.db
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

    // Filters
    if (is_active !== undefined) base = base.where('t.is_active', '=', is_active)
    if (category !== undefined) base = base.where('t.category', '=', category)
    if (parent_id !== undefined) base = base.where('t.parent_id', '=', parent_id)

    const { query, totalItems, page: p, pageSize: ps, resolvedSortField, resolvedSortDirection } = await buildFilters(
      base,
      {
        page,
        pageSize,
        search: (q as any).search ?? search ?? search2,
        applySearch: (qb, s) =>
          qb.where((eb) =>
            eb.or([
              sql`coalesce(t_req.name, t_en.name) ilike ${'%' + s + '%'}`,
              sql`coalesce(t_req.short_text, t_en.short_text) ilike ${'%' + s + '%'}`,
              sql`coalesce(t_req.description, t_en.description) ilike ${'%' + s + '%'}`,
              sql`t.code ilike ${'%' + s + '%'}`,
            ]),
          ),
        countDistinct: 't.id',
        sort: { field: (q as any).sort ?? 'created_at', direction: (q as any).direction ?? 'desc' },
        defaultSort: { field: 'created_at', direction: 'desc' },
        sortColumnMap: {
          created_at: 't.created_at',
          modified_at: 't.modified_at',
          code: 't.code',
          category: 't.category',
          name: sql`lower(coalesce(t_req.name, t_en.name))`,
          is_active: 't.is_active',
          created_by: 't.created_by',
        },
      },
    )

    const rows = await query.execute()
    const data = rows

    globalThis.logger?.info('Tags listed', {
      lang,
      page: p,
      pageSize: ps,
      count: data.length,
      search: ((q as any).search ?? search ?? search2) ?? null,
      sort: resolvedSortField ?? 'created_at',
      direction: resolvedSortDirection ?? 'desc',
      timeMs: Date.now() - startedAt,
    })

    return createPaginatedResponse(data as any[], totalItems, p, ps, ((q as any).search ?? search ?? search2) ?? null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch tags', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
