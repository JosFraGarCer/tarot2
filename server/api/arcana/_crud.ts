// server/api/arcana/_crud.ts
import { sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import { arcanaQuerySchema, arcanaCreateSchema, arcanaUpdateSchema } from '../../schemas/arcana'
import { fetchTagsForEntities } from '../../utils/eagerTags'
import type { DB, CardStatus } from '../../database/types'
import type { Kysely, SelectQueryBuilder } from 'kysely'
import type { z } from 'zod'

// Inferred types from Zod schemas
type ArcanaQuery = z.infer<typeof arcanaQuerySchema>
type ArcanaCreate = z.infer<typeof arcanaCreateSchema>
type ArcanaUpdate = z.infer<typeof arcanaUpdateSchema>

// Tag type for arcana entities
export interface ArcanaTagInfo {
  id: number
  name: string
  language_code_resolved: string
}

// Row type returned by buildSelect query
export interface ArcanaRow {
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
  tags: ArcanaTagInfo[]
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
function buildSelect(db: Kysely<DB>, lang: string): SelectQueryBuilder<any, any, ArcanaRow> {
  return db
    .selectFrom('arcana as a')
    .leftJoin('users as u', 'u.id', 'a.created_by')
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
      sql`u.username`.as('create_user'),
      sql`'[]'::json`.as('tags'), // Placeholder, populated via transformRows
    ])
}

export const arcanaCrud = createCrudHandlers({
  entity: 'arcana',
  baseTable: 'arcana',
  schema: {
    query: arcanaQuerySchema,
    create: arcanaCreateSchema,
    update: arcanaUpdateSchema,
  },
  translation: {
    table: 'arcana_translations',
    foreignKey: 'arcana_id',
    languageKey: 'language_code',
    defaultLang: 'en',
  },
  buildListQuery: ({ db, lang, query }: { db: Kysely<DB>; lang: string; query: ArcanaQuery }) => {
    const tagsLower = query.tags?.map((tag) => tag.toLowerCase())
    const tagIds = query.tag_ids
    let base = buildSelect(db, lang)

    if (query.is_active !== undefined) {
      base = base.where('a.is_active', '=', query.is_active)
    }
    if (query.created_by !== undefined) {
      base = base.where('a.created_by', '=', query.created_by)
    }

    if (tagIds && tagIds.length > 0) {
      base = base.where(sql`exists (
        select 1
        from tag_links tl
        where tl.entity_type = ${'arcana'}
          and tl.entity_id = a.id
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
        where tl.entity_type = ${'arcana'}
          and tl.entity_id = a.id
          and lower(coalesce(tt_req.name, tt_en.name)) = any(${tagsLower})
      )`)
    }

    return {
      baseQuery: base,
      filters: {
        search: query.search ?? query.q,
        status: query.status,
        statusColumn: 'a.status',
        countDistinct: 'a.id',
        sort: { field: query.sort, direction: query.direction },
        defaultSort: { field: 'created_at', direction: 'desc' },
        sortColumnMap: {
          created_at: 'a.created_at',
          modified_at: 'a.modified_at',
          code: 'a.code',
          status: 'a.status',
          name: sql`lower(coalesce(t_req.name, t_en.name))`,
          is_active: 'a.is_active',
          created_by: 'a.created_by',
        },
      },
      transformRows: async (rows: ArcanaRow[], { db, lang }) => {
        if (!rows.length) return rows
        const ids = rows.map((r) => r.id)
        const tagsMap = await fetchTagsForEntities(db, 'arcana', ids, lang)
        return rows.map((row) => ({
          ...row,
          tags: tagsMap[row.id] || [],
        }))
      },
      logMeta: ({ rows }: { rows: ArcanaRow[] }) => ({
        tag_ids: tagIds ?? null,
        tags: tagsLower ?? null,
        count_tags: rows.reduce((acc, row) => acc + (Array.isArray(row?.tags) ? row.tags.length : 0), 0),
      }),
    }
  },
  selectOne: async ({ db, lang }: { db: Kysely<DB>; lang: string }, id: number) => {
    const row = await buildSelect(db, lang)
      .where('a.id', '=', id)
      .executeTakeFirst()
    
    if (row) {
      const tagsMap = await fetchTagsForEntities(db, 'arcana', [row.id], lang)
      row.tags = tagsMap[row.id] || []
    }
    return row
  },
  mutations: {
    buildCreatePayload: (input: ArcanaCreate, ctx) => {
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
      return {
        baseData,
        translationData,
        lang: input.lang,
      }
    },
    buildUpdatePayload: (input: ArcanaUpdate, ctx) => {
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
      return {
        baseData,
        translationData,
        lang: input.lang,
      }
    },
  },
  logScope: 'arcana',
})
