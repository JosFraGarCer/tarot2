// server/api/skill/_crud.ts
import { sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  skillQuerySchema,
  skillCreateSchema,
  skillUpdateSchema,
} from '../../schemas/skill'
import type { DB, CardStatus, Json } from '../../database/types'
import type { Kysely, SelectQueryBuilder } from 'kysely'
import type { z } from 'zod'

// Inferred types from Zod schemas
type SkillQuery = z.infer<typeof skillQuerySchema>
type SkillCreate = z.infer<typeof skillCreateSchema>
type SkillUpdate = z.infer<typeof skillUpdateSchema>

// Tag type for skill entities
export interface SkillTagInfo {
  id: number
  name: string
  language_code_resolved: string
}

// Row type returned by buildSelect query
export interface SkillRow {
  id: number
  code: string
  facet_id: number
  status: CardStatus
  is_active: boolean
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
  facet: string | null
  create_user: string | null
  tags: SkillTagInfo[]
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
function buildSelect(db: Kysely<DB>, lang: string): SelectQueryBuilder<any, any, SkillRow> {
  return db
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
      's.legacy_effects',
      sql`coalesce(s.effects, '{}'::jsonb)`.as('effects'),
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
          ) filter (where tg.id is not null), '[]'::json)
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
}

export const skillCrud = createCrudHandlers({
  entity: 'skill',
  baseTable: 'base_skills',
  schema: {
    query: skillQuerySchema,
    create: skillCreateSchema,
    update: skillUpdateSchema,
  },
  translation: {
    table: 'base_skills_translations',
    foreignKey: 'base_skill_id',
    languageKey: 'language_code',
    defaultLang: 'en',
  },
  buildListQuery: ({ db, query, lang }: { db: Kysely<DB>; query: SkillQuery; lang: string }) => {
    const tagsLower = query.tags?.map((tag) => tag.toLowerCase())
    const tagIds = query.tag_ids

    let base = buildSelect(db, lang)

    if (query.is_active !== undefined) {
      base = base.where('s.is_active', '=', query.is_active)
    }
    if (query.created_by !== undefined) {
      base = base.where('s.created_by', '=', query.created_by)
    }
    if (query.facet_id !== undefined) {
      base = base.where('s.facet_id', '=', query.facet_id)
    }

    if (tagIds && tagIds.length > 0) {
      base = base.where(sql`exists (
        select 1
        from tag_links tl
        where tl.entity_type = ${'skills'}
          and tl.entity_id = s.id
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
        where tl.entity_type = ${'skills'}
          and tl.entity_id = s.id
          and lower(coalesce(tt_req.name, tt_en.name)) = any(${tagsLower})
      )`)
    }

    return {
      baseQuery: base,
      filters: {
        search: query.search ?? query.q,
        status: query.status,
        statusColumn: 's.status',
        countDistinct: 's.id',
        sort: { field: query.sort, direction: query.direction },
        defaultSort: { field: 'created_at', direction: 'desc' },
        sortColumnMap: {
          created_at: 's.created_at',
          modified_at: 's.modified_at',
          code: 's.code',
          status: 's.status',
          name: sql`lower(coalesce(t_req.name, t_en.name))`,
          is_active: 's.is_active',
          created_by: 's.created_by',
          facet_id: 's.facet_id',
        },
        applySearch: (qb, term) =>
          qb.where((eb) =>
            eb.or([
              sql`coalesce(t_req.name, t_en.name) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req.short_text, t_en.short_text) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req.description, t_en.description) ilike ${'%' + term + '%'}`,
              sql`s.code ilike ${'%' + term + '%'}`,
            ]),
          ),
      },
      logMeta: ({ rows }: { rows: SkillRow[] }) => ({
        facet_id: query.facet_id ?? null,
        tag_ids: tagIds ?? null,
        tags: tagsLower ?? null,
        count_tags: rows.reduce(
          (acc, row) => acc + (Array.isArray(row?.tags) ? row.tags.length : 0),
          0,
        ),
      }),
    }
  },
  selectOne: ({ db, lang }: { db: Kysely<DB>; lang: string }, id: number) =>
    buildSelect(db, lang)
      .where('s.id', '=', id)
      .executeTakeFirst(),
  mutations: {
    buildCreatePayload: (input: SkillCreate, ctx) => {
      const userId = (ctx.event.context.user as { id: number } | undefined)?.id ?? null
      const baseData = sanitize({
        code: input.code,
        facet_id: input.facet_id,
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
    buildUpdatePayload: (input: SkillUpdate, ctx) => {
      const userId = (ctx.event.context.user as { id: number } | undefined)?.id ?? null
      const baseData = sanitize({
        code: input.code,
        facet_id: input.facet_id,
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
  logScope: 'skill',
})
