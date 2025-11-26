// server/api/card_type/_crud.ts
import { sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  baseCardTypeQuerySchema,
  baseCardTypeCreateSchema,
  baseCardTypeUpdateSchema,
} from '../../schemas/base-card-type'

function sanitize<T extends Record<string, any>>(input: T): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) out[key] = value
  }
  return out
}

function buildSelect(db: any, lang: string) {
  return db
    .selectFrom('base_card_type as ct')
    .leftJoin('users as u', 'u.id', 'ct.created_by')
    .leftJoin('base_card_type_translations as t_req', (join: any) =>
      join.onRef('t_req.card_type_id', '=', 'ct.id').on('t_req.language_code', '=', lang),
    )
    .leftJoin('base_card_type_translations as t_en', (join: any) =>
      join.onRef('t_en.card_type_id', '=', 'ct.id').on('t_en.language_code', '=', sql`'en'`),
    )
    .select([
      'ct.id',
      'ct.code',
      'ct.status',
      'ct.is_active',
      'ct.created_by',
      'ct.image',
      'ct.created_at',
      'ct.modified_at',
      sql`coalesce(t_req.name, t_en.name)`.as('name'),
      sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
      sql`coalesce(t_req.description, t_en.description)`.as('description'),
      sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
      sql`u.username`.as('create_user'),
    ])
}

export const cardTypeCrud = createCrudHandlers({
  entity: 'card_type',
  baseTable: 'base_card_type',
  schema: {
    query: baseCardTypeQuerySchema,
    create: baseCardTypeCreateSchema,
    update: baseCardTypeUpdateSchema,
  },
  translation: {
    table: 'base_card_type_translations',
    foreignKey: 'card_type_id',
    languageKey: 'language_code',
    defaultLang: 'en',
  },
  buildListQuery: ({ db, query, lang }) => {
    let base = buildSelect(db, lang)

    if (query.is_active !== undefined) {
      base = base.where('ct.is_active', '=', query.is_active)
    }
    if (query.created_by !== undefined) {
      base = base.where('ct.created_by', '=', query.created_by)
    }

    return {
      baseQuery: base,
      filters: {
        search: query.search ?? query.q,
        status: query.status,
        statusColumn: 'ct.status',
        countDistinct: 'ct.id',
        sort: { field: query.sort, direction: query.direction },
        defaultSort: { field: 'created_at', direction: 'desc' },
        sortColumnMap: {
          created_at: 'ct.created_at',
          modified_at: 'ct.modified_at',
          code: 'ct.code',
          status: 'ct.status',
          name: sql`lower(coalesce(t_req.name, t_en.name))`,
          is_active: 'ct.is_active',
          created_by: 'ct.created_by',
        },
        applySearch: (qb, s) =>
          qb.where((eb) =>
            eb.or([
              sql`coalesce(t_req.name, t_en.name) ilike ${'%' + s + '%'}`,
              sql`coalesce(t_req.short_text, t_en.short_text) ilike ${'%' + s + '%'}`,
              sql`coalesce(t_req.description, t_en.description) ilike ${'%' + s + '%'}`,
              sql`ct.code ilike ${'%' + s + '%'}`,
            ]),
          ),
      },
      logMeta: () => ({}),
    }
  },
  selectOne: ({ db, lang }, id) =>
    buildSelect(db, lang)
      .where('ct.id', '=', id)
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
  logScope: 'card_type',
})
