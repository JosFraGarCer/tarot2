// server/api/world_card/_crud.ts
import { sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  worldCardQuerySchema,
  worldCardCreateSchema,
  worldCardUpdateSchema,
} from '../../schemas/world-card'

function sanitize<T extends Record<string, any>>(input: T): Record<string, any> {
  const output: Record<string, any> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      output[key] = value
    }
  }
  return output
}

function buildSelect(db: any, lang: string) {
  return db
    .selectFrom('world_card as wc')
    .leftJoin('users as u', 'u.id', 'wc.created_by')
    .leftJoin('world as w', 'w.id', 'wc.world_id')
    .leftJoin('world_translations as wt_req', (join: any) =>
      join.onRef('wt_req.world_id', '=', 'w.id').on('wt_req.language_code', '=', lang),
    )
    .leftJoin('world_translations as wt_en', (join: any) =>
      join.onRef('wt_en.world_id', '=', 'w.id').on('wt_en.language_code', '=', sql`'en'`),
    )
    .leftJoin('base_card as bc', 'bc.id', 'wc.base_card_id')
    .leftJoin('base_card_translations as bc_req', (join: any) =>
      join.onRef('bc_req.card_id', '=', 'bc.id').on('bc_req.language_code', '=', lang),
    )
    .leftJoin('base_card_translations as bc_en', (join: any) =>
      join.onRef('bc_en.card_id', '=', 'bc.id').on('bc_en.language_code', '=', sql`'en'`),
    )
    .leftJoin('world_card_translations as t_req', (join: any) =>
      join.onRef('t_req.card_id', '=', 'wc.id').on('t_req.language_code', '=', lang),
    )
    .leftJoin('world_card_translations as t_en', (join: any) =>
      join.onRef('t_en.card_id', '=', 'wc.id').on('t_en.language_code', '=', sql`'en'`),
    )
    .select([
      'wc.id',
      'wc.code',
      'wc.world_id',
      'wc.base_card_id',
      'wc.is_override',
      'wc.status',
      'wc.is_active',
      'wc.created_by',
      'wc.image',
      'wc.legacy_effects',
      sql`coalesce(wc.effects, '{}'::jsonb)`.as('effects'),
      'wc.created_at',
      'wc.modified_at',
      sql`coalesce(t_req.name, t_en.name)`.as('name'),
      sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
      sql`coalesce(t_req.description, t_en.description)`.as('description'),
      sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
      'w.code as world_code',
      sql`coalesce(wt_req.name, wt_en.name)`.as('world_name'),
      sql`coalesce(wt_req.language_code, 'en')`.as('world_language_code'),
      'bc.code as base_card_code',
      sql`coalesce(bc_req.name, bc_en.name)`.as('base_card_name'),
      sql`coalesce(bc_req.language_code, 'en')`.as('base_card_language_code'),
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
          where tl.entity_type = ${'world_card'} and tl.entity_id = wc.id
        )
      `.as('tags'),
    ])
}

export const worldCardCrud = createCrudHandlers({
  entity: 'world_card',
  baseTable: 'world_card',
  schema: {
    query: worldCardQuerySchema,
    create: worldCardCreateSchema,
    update: worldCardUpdateSchema,
  },
  translation: {
    table: 'world_card_translations',
    foreignKey: 'card_id',
    languageKey: 'language_code',
    defaultLang: 'en',
  },
  buildListQuery: ({ db, query, lang }) => {
    const tagsLower = query.tags?.map((tag: string) => tag.toLowerCase())
    const tagIds = query.tag_ids

    let base = buildSelect(db, lang)

    if (query.is_active !== undefined) {
      base = base.where('wc.is_active', '=', query.is_active)
    }
    if (query.created_by !== undefined) {
      base = base.where('wc.created_by', '=', query.created_by)
    }
    if (query.world_id !== undefined) {
      base = base.where('wc.world_id', '=', query.world_id)
    }
    if (query.base_card_id !== undefined) {
      base = base.where('wc.base_card_id', '=', query.base_card_id)
    }

    if (tagIds && tagIds.length > 0) {
      base = base.where(sql`(
        select count(distinct tl.tag_id)
        from tag_links tl
        where tl.entity_type = ${'world_card'}
          and tl.entity_id = wc.id
          and tl.tag_id = any(${tagIds})
      ) >= ${tagIds.length}`)
    }

    if (tagsLower && tagsLower.length > 0) {
      base = base.where(sql`(
        select count(distinct lower(coalesce(tt_req.name, tt_en.name)))
        from tag_links tl
        join tags t on t.id = tl.tag_id
        left join tags_translations tt_req on tt_req.tag_id = t.id and tt_req.language_code = ${lang}
        left join tags_translations tt_en on tt_en.tag_id = t.id and tt_en.language_code = 'en'
        where tl.entity_type = ${'world_card'}
          and tl.entity_id = wc.id
          and lower(coalesce(tt_req.name, tt_en.name)) = any(${tagsLower})
      ) >= ${tagsLower.length}`)
    }

    return {
      baseQuery: base,
      filters: {
        search: query.search ?? query.q,
        status: query.status,
        statusColumn: 'wc.status',
        countDistinct: 'wc.id',
        sort: { field: query.sort, direction: query.direction },
        defaultSort: { field: 'created_at', direction: 'desc' },
        sortColumnMap: {
          created_at: 'wc.created_at',
          modified_at: 'wc.modified_at',
          code: 'wc.code',
          status: 'wc.status',
          name: sql`lower(coalesce(t_req.name, t_en.name))`,
          is_active: 'wc.is_active',
          created_by: 'wc.created_by',
          world_id: 'wc.world_id',
          base_card_id: 'wc.base_card_id',
        },
        applySearch: (qb, term) =>
          qb.where((eb) =>
            eb.or([
              sql`coalesce(t_req.name, t_en.name) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req.short_text, t_en.short_text) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req.description, t_en.description) ilike ${'%' + term + '%'}`,
              sql`wc.code ilike ${'%' + term + '%'}`,
            ]),
          ),
      },
      logMeta: ({ rows }) => ({
        world_id: query.world_id ?? null,
        base_card_id: query.base_card_id ?? null,
        tag_ids: tagIds ?? null,
        tags: tagsLower ?? null,
        count_tags: rows.reduce(
          (acc: number, row: any) => acc + (Array.isArray(row?.tags) ? row.tags.length : 0),
          0,
        ),
      }),
    }
  },
  selectOne: ({ db, lang }, id) =>
    buildSelect(db, lang)
      .where('wc.id', '=', id)
      .executeTakeFirst(),
  mutations: {
    buildCreatePayload: (input, ctx) => {
      const userId = (ctx.event.context.user as any)?.id ?? null
      const baseData = sanitize({
        code: input.code,
        world_id: input.world_id,
        base_card_id: input.base_card_id ?? null,
        is_override: input.is_override ?? null,
        status: input.status,
        is_active: input.is_active,
        image: input.image ?? null,
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
        world_id: input.world_id,
        base_card_id: input.base_card_id ?? null,
        is_override: input.is_override ?? null,
        status: input.status,
        is_active: input.is_active,
        image: input.image ?? null,
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
  logScope: 'world_card',
})
