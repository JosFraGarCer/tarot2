// server/api/world/_crud.ts
import { sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  worldQuerySchema,
  worldCreateSchema,
  worldUpdateSchema,
} from '../../schemas/world'
import { fetchTagsForEntities } from '../../utils/eagerTags'
import type { DB, CardStatus } from '../../database/types'
import type { Kysely, SelectQueryBuilder } from 'kysely'
import type { z } from 'zod'

// Inferred types from Zod schemas
type WorldQuery = z.infer<typeof worldQuerySchema>
type WorldCreate = z.infer<typeof worldCreateSchema>
type WorldUpdate = z.infer<typeof worldUpdateSchema>

// Tag type for world entities
export interface WorldTagInfo {
  id: number
  name: string
  language_code_resolved: string
}

// Row type returned by buildSelect query
export interface WorldRow {
  id: number
  code: string
  status: CardStatus
  is_active: boolean
  created_by: number | null
  image: string | null
  created_at: Date
  modified_at: Date
  name: string | null
  short_text: string | null
  description: string | null
  language_code_resolved: string
  create_user: string | null
  tags: WorldTagInfo[]
}

function sanitize<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  const output: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      output[key] = value
    }
  }
  return output
}

// Returns a SelectQueryBuilder - using 'any' for complex joined table type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSelect(db: Kysely<DB>, lang: string): SelectQueryBuilder<any, any, WorldRow> {
  return db
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
      sql`'[]'::json`.as('tags'), // Placeholder
    ])
}

export const worldCrud = createCrudHandlers({
  entity: 'world',
  baseTable: 'world',
  schema: {
    query: worldQuerySchema,
    create: worldCreateSchema,
    update: worldUpdateSchema,
  },
  translation: {
    table: 'world_translations',
    foreignKey: 'world_id',
    languageKey: 'language_code',
    defaultLang: 'en',
  },
  buildListQuery: ({ db, query, lang }: { db: Kysely<DB>; query: WorldQuery; lang: string }) => {
    const tagsLower = query.tags?.map((tag) => tag.toLowerCase())
    const tagIds = query.tag_ids

    let base = buildSelect(db, lang)

    if (query.is_active !== undefined) {
      base = base.where('w.is_active', '=', query.is_active)
    }
    if (query.created_by !== undefined) {
      base = base.where('w.created_by', '=', query.created_by)
    }

    if (tagIds && tagIds.length > 0) {
      base = base.where(sql`exists (
        select 1
        from tag_links tl
        where tl.entity_type = ${'world'}
          and tl.entity_id = w.id
          and tl.tag_id = any(${tagIds})
      )`)
    }

    if (tagsLower && tagsLower.length > 0) {
      base = base.where(sql`exists (
        select 1
        from tag_links tl
        join tags t on t.id = tl.tag_id
        left join tags_translations tt_req on tt_req.tag_id = t.id and tt_req.language_code = ${lang}
        left join tags_translations tt_en on tt_en.tag_id = t.id and tt_en.language_code = 'en'
        where tl.entity_type = ${'world'}
          and tl.entity_id = w.id
          and lower(coalesce(tt_req.name, tt_en.name)) = any(${tagsLower})
      )`)
    }

    return {
      baseQuery: base,
      filters: {
        search: query.search ?? query.q,
        status: query.status,
        statusColumn: 'w.status',
        countDistinct: 'w.id',
        sort: { field: query.sort, direction: query.direction },
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
        applySearch: (qb, term) =>
          qb.where((eb) =>
            eb.or([
              sql`coalesce(t_req.name, t_en.name) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req.short_text, t_en.short_text) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req.description, t_en.description) ilike ${'%' + term + '%'}`,
              sql`w.code ilike ${'%' + term + '%'}`,
            ]),
          ),
      },
      transformRows: async (rows: WorldRow[], { db, lang }) => {
        if (!rows.length) return rows
        const ids = rows.map((r) => r.id)
        const tagsMap = await fetchTagsForEntities(db, 'world', ids, lang)
        return rows.map((row) => ({
          ...row,
          tags: tagsMap[row.id] || [],
        }))
      },
      logMeta: ({ rows }: { rows: WorldRow[] }) => ({
        status: query.status ?? null,
        is_active: query.is_active ?? null,
        created_by: query.created_by ?? null,
        tag_ids: tagIds ?? null,
        tags: tagsLower ?? null,
        count_tags: rows.reduce(
          (acc, row) => acc + (Array.isArray(row?.tags) ? row.tags.length : 0),
          0,
        ),
      }),
    }
  },
  selectOne: async ({ db, lang }: { db: Kysely<DB>; lang: string }, id: number) => {
    const row = await buildSelect(db, lang)
      .where('w.id', '=', id)
      .executeTakeFirst()
    
    if (row) {
      const tagsMap = await fetchTagsForEntities(db, 'world', [row.id], lang)
      row.tags = tagsMap[row.id] || []
    }
    return row
  },
  mutations: {
    buildCreatePayload: (input: WorldCreate, ctx) => {
      const userId = (ctx.event.context.user as { id: number } | undefined)?.id ?? null
      const baseData = sanitize({
        code: input.code,
        image: input.image ?? null,
        status: input.status,
        is_active: input.is_active,
        created_by: userId,
        updated_by: userId,
      })
      const translationData = sanitize({
        name: input.name,
        short_text: input.short_text ?? null,
        description: input.description ?? null,
      })
      return { baseData, translationData, lang: input.lang }
    },
    buildUpdatePayload: (input: WorldUpdate, ctx) => {
      const userId = (ctx.event.context.user as { id: number } | undefined)?.id ?? null
      const baseData = sanitize({
        code: input.code,
        image: input.image ?? null,
        status: input.status,
        is_active: input.is_active,
        updated_by: userId,
      })
      const translationData = sanitize({
        name: input.name,
        short_text: input.short_text ?? null,
        description: input.description ?? null,
      })
      return { baseData, translationData, lang: input.lang }
    },
  },
  logScope: 'world',
})
