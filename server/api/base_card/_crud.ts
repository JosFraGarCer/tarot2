// server/api/base_card/_crud.ts
import { sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  baseCardQuerySchema,
  baseCardCreateSchema,
  baseCardUpdateSchema,
} from '../../schemas/base-card'
import { fetchTagsForEntities } from '../../utils/eagerTags'
import type { DB, CardStatus, Json } from '../../database/types'
import type { Kysely, SelectQueryBuilder } from 'kysely'
import type { z } from 'zod'

// Inferred types from Zod schemas
type BaseCardQuery = z.infer<typeof baseCardQuerySchema>
type BaseCardCreate = z.infer<typeof baseCardCreateSchema>
type BaseCardUpdate = z.infer<typeof baseCardUpdateSchema>

// Tag type for base_card entities
export interface BaseCardTagInfo {
  id: number
  name: string
  language_code_resolved: string
}

// Row type returned by buildSelect query
export interface BaseCardRow {
  id: number
  code: string
  card_type_id: number
  status: CardStatus
  is_active: boolean | null
  created_by: number | null
  image: string | null
  legacy_effects: boolean
  effects: Json | null
  created_at: Date
  modified_at: Date
  name: string | null
  short_text: string | null
  description: string | null
  language_code_resolved: string
  card_type_name: string | null
  create_user: string | null
  tags: BaseCardTagInfo[]
}

function sanitize<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) out[key] = value
  }
  return out
}

// Returns a SelectQueryBuilder - using 'any' for complex joined table type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSelect(db: Kysely<DB>, lang: string): SelectQueryBuilder<any, any, BaseCardRow> {
  return db
    .selectFrom('base_card as c')
    .leftJoin('users as u', 'u.id', 'c.created_by')
    .leftJoin('base_card_translations as t_req', (join) =>
      join.onRef('t_req.card_id', '=', 'c.id').on('t_req.language_code', '=', lang),
    )
    .leftJoin('base_card_translations as t_en', (join) =>
      join.onRef('t_en.card_id', '=', 'c.id').on('t_en.language_code', '=', sql`'en'`),
    )
    .leftJoin('base_card_type_translations as t_req_ct', (join) =>
      join.onRef('t_req_ct.card_type_id', '=', 'c.card_type_id').on('t_req_ct.language_code', '=', lang),
    )
    .leftJoin('base_card_type_translations as t_en_ct', (join) =>
      join.onRef('t_en_ct.card_type_id', '=', 'c.card_type_id').on('t_en_ct.language_code', '=', sql`'en'`),
    )
    .select([
      'c.id',
      'c.code',
      'c.card_type_id',
      'c.status',
      'c.is_active',
      'c.created_by',
      'c.image',
      'c.legacy_effects',
      sql`coalesce(c.effects, '{}'::jsonb)`.as('effects'),
      'c.created_at',
      'c.modified_at',
      sql`coalesce(t_req.name, t_en.name)`.as('name'),
      sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
      sql`coalesce(t_req.description, t_en.description)`.as('description'),
      sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
      sql`coalesce(t_req_ct.name, t_en_ct.name)`.as('card_type_name'),
      sql`u.username`.as('create_user'),
      sql`'[]'::json`.as('tags'), // Placeholder
    ])
}

export const baseCardCrud = createCrudHandlers({
  entity: 'base_card',
  baseTable: 'base_card',
  schema: {
    query: baseCardQuerySchema,
    create: baseCardCreateSchema,
    update: baseCardUpdateSchema,
  },
  translation: {
    table: 'base_card_translations',
    foreignKey: 'card_id',
    languageKey: 'language_code',
    defaultLang: 'en',
  },
  buildListQuery: ({ db, query, lang }: { db: Kysely<DB>; query: BaseCardQuery; lang: string }) => {
    const tagsLower = query.tags?.map((tag) => tag.toLowerCase())
    const tagIds = query.tag_ids

    let base = buildSelect(db, lang)

    if (query.is_active !== undefined) {
      base = base.where('c.is_active', '=', query.is_active)
    }
    if (query.created_by !== undefined) {
      base = base.where('c.created_by', '=', query.created_by)
    }
    if (query.card_type_id !== undefined) {
      base = base.where('c.card_type_id', '=', query.card_type_id)
    }

    if (tagIds && tagIds.length > 0) {
      base = base.where(sql`exists (
        select 1
        from tag_links tl
        where tl.entity_type = ${'base_card'}
          and tl.entity_id = c.id
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
        where tl.entity_type = ${'base_card'}
          and tl.entity_id = c.id
          and lower(coalesce(tt_req.name, tt_en.name)) = any(${tagsLower})
      )`)
    }

    return {
      baseQuery: base,
      filters: {
        search: query.search ?? query.q,
        status: query.status,
        statusColumn: 'c.status',
        countDistinct: 'c.id',
        sort: { field: query.sort, direction: query.direction },
        defaultSort: { field: 'created_at', direction: 'desc' },
        sortColumnMap: {
          created_at: 'c.created_at',
          modified_at: 'c.modified_at',
          code: 'c.code',
          status: 'c.status',
          name: sql`lower(coalesce(t_req.name, t_en.name))`,
          is_active: 'c.is_active',
          created_by: 'c.created_by',
          card_type_id: 'c.card_type_id',
        },
        applySearch: (qb, s) =>
          qb.where((eb) =>
            eb.or([
              sql`coalesce(t_req.name, t_en.name) ilike ${'%' + s + '%'}`,
              sql`coalesce(t_req.short_text, t_en.short_text) ilike ${'%' + s + '%'}`,
              sql`coalesce(t_req.description, t_en.description) ilike ${'%' + s + '%'}`,
              sql`c.code ilike ${'%' + s + '%'}`,
            ]),
          ),
      },
      transformRows: async (rows: BaseCardRow[], { db, lang }) => {
        if (!rows.length) return rows
        const ids = rows.map((r) => r.id)
        const tagsMap = await fetchTagsForEntities(db, 'base_card', ids, lang)
        return rows.map((row) => ({
          ...row,
          tags: tagsMap[row.id] || [],
        }))
      },
      logMeta: ({ rows }: { rows: BaseCardRow[] }) => ({
        tag_ids: tagIds ?? null,
        tags: tagsLower ?? null,
        count_tags: rows.reduce((acc, row) => acc + (Array.isArray(row?.tags) ? row.tags.length : 0), 0),
      }),
    }
  },
  selectOne: async ({ db, lang }: { db: Kysely<DB>; lang: string }, id: number) => {
    const row = await buildSelect(db, lang)
      .where('c.id', '=', id)
      .executeTakeFirst()
    
    if (row) {
      const tagsMap = await fetchTagsForEntities(db, 'base_card', [row.id], lang)
      row.tags = tagsMap[row.id] || []
    }
    return row
  },
  mutations: {
    buildCreatePayload: (input: BaseCardCreate, ctx) => {
      const userId = (ctx.event.context.user as { id: number } | undefined)?.id ?? null
      const baseData = sanitize({
        code: input.code,
        card_type_id: input.card_type_id,
        image: input.image ?? null,
        status: input.status,
        is_active: input.is_active,
        legacy_effects: input.legacy_effects,
        effects: input.effects ?? null,
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
    buildUpdatePayload: (input: BaseCardUpdate, ctx) => {
      const userId = (ctx.event.context.user as { id: number } | undefined)?.id ?? null
      const baseData = sanitize({
        code: input.code,
        card_type_id: input.card_type_id,
        image: input.image ?? null,
        status: input.status,
        is_active: input.is_active,
        legacy_effects: input.legacy_effects,
        effects: input.effects ?? null,
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
  logScope: 'base_card',
})
