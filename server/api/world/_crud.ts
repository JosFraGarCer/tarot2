// server/api/world/_crud.ts
import { sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  worldQuerySchema,
  worldCreateSchema,
  worldUpdateSchema,
} from '../../schemas/world'

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
    .selectFrom('world as w')
    .leftJoin('users as u', 'u.id', 'w.created_by')
    .leftJoin('world_translations as t_req', (join: any) =>
      join.onRef('t_req.world_id', '=', 'w.id').on('t_req.language_code', '=', lang),
    )
    .leftJoin('world_translations as t_en', (join: any) =>
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
          ) filter (where tg.id is not null), '[]'::json)
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
  buildListQuery: ({ db, query, lang }) => {
    const tagsLower = query.tags?.map((tag: string) => tag.toLowerCase())
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
      logMeta: ({ rows }) => ({
        status: query.status ?? null,
        is_active: query.is_active ?? null,
        created_by: query.created_by ?? null,
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
      .where('w.id', '=', id)
      .executeTakeFirst(),
  mutations: {
    buildCreatePayload: (input, ctx) => {
      const userId = (ctx.event.context.user as any)?.id ?? null
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
    buildUpdatePayload: (input, ctx) => {
      const userId = (ctx.event.context.user as any)?.id ?? null
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
