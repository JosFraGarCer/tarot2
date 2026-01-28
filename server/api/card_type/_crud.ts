// server/api/card_type/_crud.ts
import { sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  baseCardTypeQuerySchema,
  baseCardTypeCreateSchema,
  baseCardTypeUpdateSchema,
} from '@shared/schemas/entities/cardtype'
import { buildTranslationSelect } from '../../utils/i18n'
import type { DB } from '../../database/types'

function buildSelect(db: any, lang: string) {
  const base = db
    .selectFrom('base_card_type as ct')
    .leftJoin('users as u', 'u.id', 'ct.created_by')

  const { query, selects } = buildTranslationSelect(base, {
    baseAlias: 'ct',
    translationTable: 'base_card_type_translations',
    foreignKey: 'card_type_id',
    lang,
    fields: ['name', 'short_text', 'description'],
  })

  return query.select([
    'ct.id',
    'ct.code',
    'ct.status',
    'ct.is_active',
    'ct.created_by',
    'ct.image',
    'ct.created_at',
    'ct.modified_at',
    ...selects,
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
          name: sql`lower(coalesce(t_req_base_card_type_translations.name, t_en_base_card_type_translations.name))`,
          is_active: 'ct.is_active',
          created_by: 'ct.created_by',
        },
        applySearch: (qb, term) =>
          qb.where((eb: any) =>
            eb.or([
              sql`coalesce(t_req_base_card_type_translations.name, t_en_base_card_type_translations.name) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req_base_card_type_translations.short_text, t_en_base_card_type_translations.short_text) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req_base_card_type_translations.description, t_en_base_card_type_translations.description) ilike ${'%' + term + '%'}`,
              sql`ct.code ilike ${'%' + term + '%'}`,
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
      const baseData = {
        code: input.code,
        image: input.image ?? null,
        status: input.status,
        is_active: input.is_active,
        created_by: userId,
        updated_by: userId,
      }
      const translationData = {
        name: input.name,
        short_text: input.short_text ?? null,
        description: input.description ?? null,
      }
      return { baseData, translationData, lang: input.lang }
    },
    buildUpdatePayload: (input, ctx) => {
      const userId = (ctx.event.context.user as any)?.id ?? null
      const baseData = {
        code: input.code,
        image: input.image ?? null,
        status: input.status,
        is_active: input.is_active,
        updated_by: userId,
      }
      const translationData = {
        name: input.name,
        short_text: input.short_text ?? null,
        description: input.description ?? null,
      }
      return { baseData, translationData, lang: input.lang }
    },
  },
  logScope: 'card_type',
})
