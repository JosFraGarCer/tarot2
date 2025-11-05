// server/api/base_card_type/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import { createPaginatedResponse } from '../../utils/response'
import { safeParseOrThrow } from '../../utils/validate'
import { buildFilters } from '../../utils/filters'
import { getRequestedLanguage } from '../../utils/i18n'
import { sql } from 'kysely'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().min(1).max(100).optional(),
  is_active: z.coerce.boolean().optional(),
  created_by: z.coerce.number().int().optional(),
  status: z.string().optional(),
  lang: z.string().optional(),
  language: z.string().optional(),
  locale: z.string().optional(),
  sort: z
    .enum([
      'created_at',
      'modified_at',
      'code',
      'status',
      'name',
      'is_active',
      'created_by',
    ])
    .optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const q = getQuery(event)
    const { page, pageSize, q: search, status, is_active, created_by } = safeParseOrThrow(querySchema, q)
    const lang = getRequestedLanguage(q)

    // DB index suggestion:
    // - idx_base_card_type_code (code)
    // - idx_base_card_type_status (status)
    // - idx_base_card_type_translations_fk_lang (card_type_id, language_code)
    // - idx_base_card_type_translations_lang (language_code)

    let base = globalThis.db
      .selectFrom('base_card_type as ct')
      .leftJoin('users as u', 'u.id', 'ct.created_by')
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
        sql`u.username`.as('create_user'),
      ])

    if (is_active !== undefined) base = base.where('ct.is_active', '=', is_active)
    if (created_by !== undefined) base = base.where('ct.created_by', '=', created_by)

    const { query, totalItems, page: p, pageSize: ps, resolvedSortField, resolvedSortDirection } = await buildFilters(base, {
      page,
      pageSize,
      search: (q as any).search ?? search,
      status,
      statusColumn: 'ct.status',
      applySearch: (qb, s) =>
        qb.where((eb) =>
          eb.or([
            sql`coalesce(t_req.name, t_en.name) ilike ${'%' + s + '%'}`,
            sql`coalesce(t_req.short_text, t_en.short_text) ilike ${'%' + s + '%'}`,
            sql`coalesce(t_req.description, t_en.description) ilike ${'%' + s + '%'}`,
            sql`ct.code ilike ${'%' + s + '%'}`,
          ]),
        ),
      countDistinct: 'ct.id',
      sort: { field: q.sort ?? 'created_at', direction: q.direction ?? 'desc' },
      defaultSort: { field: 'created_at', direction: 'desc' },
      sortColumnMap: {
        created_at: 'ct.created_at',
        modified_at: 'ct.modified_at',
        code: 'ct.code',
        status: 'ct.status',
        name: sql`lower(coalesce(t_req.name, t_en.name))`,
        is_active: 'ct.is_active',
        created_by: 'ct.created_by',
      },
    })

    const rows = await query.execute()
    const data = rows

    globalThis.logger?.info('Card types listed', {
      page: p,
      pageSize: ps,
      count: data.length,
      sort: resolvedSortField ?? 'created_at',
      direction: resolvedSortDirection ?? 'desc',
      search: ((q as any).search ?? search) ?? null,
      lang,
      status: status ?? null,
      is_active: is_active ?? null,
      created_by: created_by ?? null,
      timeMs: Date.now() - startedAt,
    })

    return createPaginatedResponse(data, totalItems, p, ps, ((q as any).search ?? search) ?? null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch card types', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
