// server/api/facet/_crud.ts
import { sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  facetQuerySchema,
  facetCreateSchema,
  facetUpdateSchema,
} from '../../schemas/facet'

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
    .selectFrom('facet as f')
    .leftJoin('users as u', 'u.id', 'f.created_by')
    .leftJoin('facet_translations as t_req', (join: any) =>
      join.onRef('t_req.facet_id', '=', 'f.id').on('t_req.language_code', '=', lang),
    )
    .leftJoin('facet_translations as t_en', (join: any) =>
      join.onRef('t_en.facet_id', '=', 'f.id').on('t_en.language_code', '=', sql`'en'`),
    )
    .leftJoin('arcana_translations as t_req_ar', (join: any) =>
      join.onRef('t_req_ar.arcana_id', '=', 'f.arcana_id').on('t_req_ar.language_code', '=', lang),
    )
    .leftJoin('arcana_translations as t_en_ar', (join: any) =>
      join.onRef('t_en_ar.arcana_id', '=', 'f.arcana_id').on('t_en_ar.language_code', '=', sql`'en'`),
    )
    .select([
      'f.id',
      'f.code',
      'f.arcana_id',
      'f.status',
      'f.is_active',
      'f.created_by',
      'f.image',
      'f.legacy_effects',
      sql`coalesce(f.effects, '{}'::jsonb)`.as('effects'),
      'f.created_at',
      'f.modified_at',
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
          ) filter (where tg.id is not null), '[]'::json)
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
}

export const facetCrud = createCrudHandlers({
  entity: 'facet',
  baseTable: 'facet',
  schema: {
    query: facetQuerySchema,
    create: facetCreateSchema,
    update: facetUpdateSchema,
  },
  translation: {
    table: 'facet_translations',
    foreignKey: 'facet_id',
    languageKey: 'language_code',
    defaultLang: 'en',
  },
  buildListQuery: ({ db, query, lang }) => {
    const tagsLower = query.tags?.map((tag: string) => tag.toLowerCase())
    const tagIds = query.tag_ids

    let base = buildSelect(db, lang)

    if (query.is_active !== undefined) {
      base = base.where('f.is_active', '=', query.is_active)
    }
    if (query.created_by !== undefined) {
      base = base.where('f.created_by', '=', query.created_by)
    }
    if (query.arcana_id !== undefined) {
      base = base.where('f.arcana_id', '=', query.arcana_id)
    }

    if (tagIds && tagIds.length > 0) {
      base = base.where(sql`exists (
        select 1
        from tag_links tl
        where tl.entity_type = ${'facet'}
          and tl.entity_id = f.id
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
        where tl.entity_type = ${'facet'}
          and tl.entity_id = f.id
          and lower(coalesce(tt_req.name, tt_en.name)) = any(${tagsLower})
      )`)
    }

    return {
      baseQuery: base,
      filters: {
        search: query.search ?? query.q,
        status: query.status,
        statusColumn: 'f.status',
        countDistinct: 'f.id',
        sort: { field: query.sort, direction: query.direction },
        defaultSort: { field: 'created_at', direction: 'desc' },
        sortColumnMap: {
          created_at: 'f.created_at',
          modified_at: 'f.modified_at',
          code: 'f.code',
          status: 'f.status',
          name: sql`lower(coalesce(t_req.name, t_en.name))`,
          is_active: 'f.is_active',
          created_by: 'f.created_by',
          arcana_id: 'f.arcana_id',
        },
        applySearch: (qb, term) =>
          qb.where((eb) =>
            eb.or([
              sql`coalesce(t_req.name, t_en.name) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req.short_text, t_en.short_text) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req.description, t_en.description) ilike ${'%' + term + '%'}`,
              sql`f.code ilike ${'%' + term + '%'}`,
            ]),
          ),
      },
      logMeta: ({ rows }) => ({
        arcana_id: query.arcana_id ?? null,
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
      .where('f.id', '=', id)
      .executeTakeFirst(),
  mutations: {
    buildCreatePayload: (input, ctx) => {
      const userId = (ctx.event.context.user as any)?.id ?? null
      const baseData = sanitize({
        code: input.code,
        arcana_id: input.arcana_id,
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
        arcana_id: input.arcana_id,
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
  logScope: 'facet',
})
