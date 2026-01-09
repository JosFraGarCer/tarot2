// server/api/base_card/_crud.ts
import { sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  baseCardQuerySchema,
  baseCardCreateSchema,
  baseCardUpdateSchema,
} from '@shared/schemas/entities/base-card'

function sanitize<T extends Record<string, any>>(input: T): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) out[key] = value
  }
  return out
}

function buildSelect(db: any, lang: string) {
  return db
    .selectFrom('base_card as c')
    .leftJoin('users as u', 'u.id', 'c.created_by')
    .leftJoin('base_card_translations as t_req', (join: any) =>
      join.onRef('t_req.card_id', '=', 'c.id').on('t_req.language_code', '=', lang),
    )
    .leftJoin('base_card_translations as t_en', (join: any) =>
      join.onRef('t_en.card_id', '=', 'c.id').on('t_en.language_code', '=', sql`'en'`),
    )
    .leftJoin('base_card_type_translations as t_req_ct', (join: any) =>
      join.onRef('t_req_ct.card_type_id', '=', 'c.card_type_id').on('t_req_ct.language_code', '=', lang),
    )
    .leftJoin('base_card_type_translations as t_en_ct', (join: any) =>
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
          where tl.entity_type = ${'base_card'} and tl.entity_id = c.id
        )
      `.as('tags'),
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
  buildListQuery: ({ db, query, lang }) => {
    const tagsLower = query.tags?.map((tag: string) => tag.toLowerCase())
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
      logMeta: ({ rows }) => ({
        tag_ids: tagIds ?? null,
        tags: tagsLower ?? null,
        count_tags: rows.reduce((acc: number, row: any) => acc + (Array.isArray(row?.tags) ? row.tags.length : 0), 0),
      }),
    }
  },
  selectOne: ({ db, lang }, id) =>
    buildSelect(db, lang)
      .where('c.id', '=', id)
      .executeTakeFirst(),
  mutations: {
    buildCreatePayload: (input, ctx) => {
      const userId = (ctx.event.context.user as any)?.id ?? null
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
    buildUpdatePayload: (input, ctx) => {
      const userId = (ctx.event.context.user as any)?.id ?? null
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
