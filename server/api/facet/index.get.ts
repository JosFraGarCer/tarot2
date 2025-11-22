// server/api/facet/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import { createPaginatedResponse } from '../../utils/response'
import { safeParseOrThrow } from '../../utils/validate'
import { buildFilters } from '../../utils/filters'
import { getRequestedLanguage } from '../../utils/i18n'
import { sql } from 'kysely'
import { queryBoolean } from '../../utils/zod'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().min(1).max(100).optional(),
  is_active: queryBoolean.optional(),
  created_by: z.coerce.number().int().optional(),
  arcana_id: z.coerce.number().int().optional(),
  status: z.string().optional(),
  lang: z.string().optional(),
  language: z.string().optional(),
  locale: z.string().optional(),
  sort: z
    .enum([
      'created_at',
      'modified_at',
      'status',
      'name',
      'is_active',
      'created_by',
      'arcana_id',
    ])
    .optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  tag_ids: z.union([z.string(), z.array(z.string())]).optional(),
})

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const q = getQuery(event)
    const { page, pageSize, q: search, status, is_active, created_by, arcana_id } = safeParseOrThrow(querySchema, q)
    const lang = getRequestedLanguage(q)

    // DB index suggestion:
    // - idx_facet_code (code)
    // - idx_facet_status (status)
    // - idx_facet_translations_fk_lang (facet_id, language_code)
    // - idx_facet_translations_lang (language_code)

    // Normalize tags inputs
    const normToArray = (v: any): string[] | undefined => {
      if (v === undefined) return undefined
      if (Array.isArray(v)) return v.flatMap((x) => String(x))
      if (typeof v === 'string') {
        const s = v.trim()
        if (!s) return []
        if (s.startsWith('[')) {
          try {
            const arr = JSON.parse(s)
            return Array.isArray(arr) ? arr.map((x) => String(x)) : [String(v)]
          } catch {
            return s.split(',')
          }
        }
        return s.split(',')
      }
      return undefined
    }
    const tagsArray = normToArray((q as any).tags)?.map((s) => s.trim()).filter(Boolean)
    const tagsLower = tagsArray?.map((s) => s.toLowerCase())
    const tagIdsArray = normToArray((q as any).tag_ids)
      ?.map((s) => Number(s))
      .filter((n) => Number.isFinite(n)) as number[] | undefined

    let base = globalThis.db
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
        'f.legacy_effects',
        sql`coalesce(f.effects, '{}'::jsonb)`.as('effects'),
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

    if (is_active !== undefined) base = base.where('f.is_active', '=', is_active)
    if (created_by !== undefined) base = base.where('f.created_by', '=', created_by)
    if (arcana_id) base = base.where('f.arcana_id', '=', arcana_id)

    // Tag filters (OR semantics)
    if (tagIdsArray && tagIdsArray.length > 0) {
      base = base.where(sql`exists (
        select 1
        from tag_links tl
        where tl.entity_type = ${'facet'}
          and tl.entity_id = f.id
          and tl.tag_id = any(${tagIdsArray})
      )`)
    }
    if (tagsLower && tagsLower.length > 0) {
      base = base.where(sql`exists (
        select 1
        from tag_links tl
        join tags t on t.id = tl.tag_id
        left join tags_translations tt_req on tt_req.tag_id = t.id and tt_req.language_code = ${lang}
        left join tags_translations tt_en on tt_en.tag_id = t.id and tt_en.language_code = 'en'
        where tl.entity_type = ${'facet'}
          and tl.entity_id = f.id
          and lower(coalesce(tt_req.name, tt_en.name)) = any(${tagsLower})
      )`)
    }

    const { query, totalItems, page: p, pageSize: ps, resolvedSortField, resolvedSortDirection } = await buildFilters(base, {
      page,
      pageSize,
      search: (q as any).search ?? search,
      status,
      statusColumn: 'f.status',
      applySearch: (qb, s) =>
        qb.where((eb) =>
          eb.or([
            sql`coalesce(t_req.name, t_en.name) ilike ${'%' + s + '%'}`,
            sql`coalesce(t_req.short_text, t_en.short_text) ilike ${'%' + s + '%'}`,
            sql`coalesce(t_req.description, t_en.description) ilike ${'%' + s + '%'}`,
            sql`f.code ilike ${'%' + s + '%'}`,
          ]),
        ),
      countDistinct: 'f.id',
      sort: { field: q.sort ?? 'created_at', direction: q.direction ?? 'desc' },
      defaultSort: { field: 'created_at', direction: 'desc' },
      sortColumnMap: {
        created_at: 'f.created_at',
        modified_at: 'f.modified_at',
        status: 'f.status',
        name: sql`lower(coalesce(t_req.name, t_en.name))`,
        is_active: 'f.is_active',
        created_by: 'f.created_by',
        arcana_id: 'f.arcana_id',
      },
    })

    const rows = await query.execute()
    const data = rows
    const count_tags = Array.isArray(data)
      ? data.reduce((acc: number, r: any) => acc + (Array.isArray(r?.tags) ? r.tags.length : 0), 0)
      : 0

    globalThis.logger?.info('Facets listed', {
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
      arcana_id: arcana_id ?? null,
      tag_ids: tagIdsArray ?? null,
      tags: tagsLower ?? null,
      count_tags,
      timeMs: Date.now() - startedAt,
    })

    return createPaginatedResponse(data, totalItems, p, ps, ((q as any).search ?? search) ?? null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch facets', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})

