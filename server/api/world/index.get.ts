// server/api/world/index.get.ts
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
  search: z.string().min(1).max(100).optional(), // 👈 añadido
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
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  tag_ids: z.union([z.string(), z.array(z.string())]).optional(),
})

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const q = getQuery(event)
    const { page, pageSize, q: search, status, is_active, created_by } = safeParseOrThrow(querySchema, q)
    const lang = getRequestedLanguage(q)

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

    // DB index suggestion:
    // - idx_world_code (code)
    // - idx_world_status (status)
    // - idx_world_translations_fk_lang (world_id, language_code)
    // - idx_world_translations_lang (language_code)

    let base = globalThis.db
      .selectFrom('world as w')
      .leftJoin('users as u', 'u.id', 'w.created_by')
      .leftJoin('world_translations as t_req', (join) =>
        join.onRef('t_req.world_id', '=', 'w.id').on('t_req.language_code', '=', lang),
      )
      .leftJoin('world_translations as t_en', (join) =>
        join.onRef('t_en.world_id', '=', 'w.id').on('t_en.language_code', '=', sql`'en'`),
      )
      .select([
        'w.id',
        'w.code',
        'w.status',
        'w.is_active',
        'w.created_by',
        'w.image',
        'w.created_at',
        'w.modified_at',
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
            where tl.entity_type = ${'world'} and tl.entity_id = w.id
          )
        `.as('tags'),
      ])

    if (is_active !== undefined) {
      base = base.where('w.is_active', '=', is_active)
    }
    if (created_by !== undefined) {
      base = base.where('w.created_by', '=', created_by)
    }

    // Tag filters (AND semantics)
    if (tagIdsArray && tagIdsArray.length > 0) {
      base = base.where(sql`w.id in (
        select tl.entity_id
        from tag_links tl
        where tl.entity_type = ${'world'} and tl.tag_id = any(${tagIdsArray})
        group by tl.entity_id
        having count(distinct tl.tag_id) = ${tagIdsArray.length}
      )`)
    }
    if (tagsLower && tagsLower.length > 0) {
      base = base.where(sql`w.id in (
        select tl.entity_id
        from tag_links tl
        join tags t on t.id = tl.tag_id
        left join tags_translations tt_req on tt_req.tag_id = t.id and tt_req.language_code = ${lang}
        left join tags_translations tt_en on tt_en.tag_id = t.id and tt_en.language_code = 'en'
        where tl.entity_type = ${'world'}
          and lower(coalesce(tt_req.name, tt_en.name)) = any(${tagsLower})
        group by tl.entity_id
        having count(distinct tl.tag_id) = ${tagsLower.length}
      )`)
    }

    const { query, totalItems, page: p, pageSize: ps, resolvedSortField, resolvedSortDirection } = await buildFilters(base, {
      page,
      pageSize,
      search: (q as any).search ?? search,
      status,
      statusColumn: 'w.status',
      applySearch: (qb, s) =>
        qb.where((eb) =>
          eb.or([
            sql`coalesce(t_req.name, t_en.name) ilike ${'%' + s + '%'}`,
            sql`coalesce(t_req.short_text, t_en.short_text) ilike ${'%' + s + '%'}`,
            sql`coalesce(t_req.description, t_en.description) ilike ${'%' + s + '%'}`,
            sql`w.code ilike ${'%' + s + '%'}`,
          ]),
        ),
      countDistinct: 'w.id',
      sort: { field: q.sort ?? 'created_at', direction: q.direction ?? 'desc' },
      defaultSort: { field: 'created_at', direction: 'desc' },
      sortColumnMap: {
        created_at: 'w.created_at',
        modified_at: 'w.modified_at',
        code: 'w.code',
        status: 'w.status',
        name: sql`lower(coalesce(t_req.name, t_en.name))`,
        is_active: 'w.is_active',
        created_by: 'w.created_by',
      },
    })

    const rows = await query.execute()
    const data = rows
    const count_tags = Array.isArray(data)
      ? data.reduce((acc: number, r: any) => acc + (Array.isArray(r?.tags) ? r.tags.length : 0), 0)
      : 0

    globalThis.logger?.info('Worlds listed', {
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
      count_tags,
      tag_ids: tagIdsArray ?? null,
      tags: tagsLower ?? null,
      timeMs: Date.now() - startedAt,
    })

    return createPaginatedResponse(data, totalItems, p, ps, ((q as any).search ?? search) ?? null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch worlds', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})

