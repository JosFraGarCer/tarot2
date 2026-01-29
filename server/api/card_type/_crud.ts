/* eslint-disable @typescript-eslint/no-explicit-any */
// server/api/card_type/_crud.ts
import { type Kysely, sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  cardTypeQuerySchema,
  cardTypeCreateSchema,
  cardTypeUpdateSchema,
} from '@shared/schemas/entities/cardtype'
import { buildTranslationSelect } from '../../utils/i18n'
import type { DB } from '../../database/types'

function buildSelect(db: Kysely<DB>, lang: string) {
  const base = db
    .selectFrom('base_card_type as ct')
    .leftJoin('users as u', 'u.id', 'ct.created_by')

  const translation = buildTranslationSelect(base, {
    baseAlias: 'ct',
    translationTable: 'base_card_type_translations',
    foreignKey: 'card_type_id',
    lang,
    fields: ['name', 'short_text', 'description'],
  })

  return {
    query: translation.query.select([
      'ct.id',
      'ct.code',
      'ct.status',
      'ct.is_active',
      'ct.created_by',
      'ct.image',
      'ct.created_at',
      'ct.modified_at',
      ...translation.selects,
      sql`u.username`.as('create_user'),
    ]),
    tReq: translation.tReq,
    tEn: translation.tEn,
  }
}

export const cardTypeCrud = createCrudHandlers({
  entity: 'card_type',
  baseTable: 'base_card_type',
  schema: {
    query: cardTypeQuerySchema,
    create: cardTypeCreateSchema,
    update: cardTypeUpdateSchema,
  },
  translation: {
    table: 'base_card_type_translations',
    foreignKey: 'card_type_id',
    languageKey: 'language_code',
    defaultLang: 'en',
  },
  buildListQuery: ({ db, query, lang }) => {
    const { query: baseQuery, tReq, tEn } = buildSelect(db, lang)
    let base = baseQuery

    if (query.is_active !== undefined) {
      base = base.where(sql.ref('ct.is_active') as any, '=', query.is_active)
    }
    if (query.created_by !== undefined) {
      base = base.where(sql.ref('ct.created_by') as any, '=', query.created_by)
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
          name: sql`lower(coalesce(${sql.ref(`${tReq}.name`)}, ${sql.ref(`${tEn}.name`)}))`,
          is_active: 'ct.is_active',
          created_by: 'ct.created_by',
        },
        applySearch: (qb, term) =>
          qb.where((eb) =>
            eb.or([
              sql`lower(coalesce(${sql.ref(`${tReq}.name`)}, ${sql.ref(`${tEn}.name`)})) ilike ${'%' + term + '%'}`,
              sql`lower(coalesce(${sql.ref(`${tReq}.short_text`)}, ${sql.ref(`${tEn}.short_text`)})) ilike ${'%' + term + '%'}`,
              sql`lower(coalesce(${sql.ref(`${tReq}.description`)}, ${sql.ref(`${tEn}.description`)})) ilike ${'%' + term + '%'}`,
              sql`ct.code ilike ${'%' + term + '%'}`,
            ] as any[]),
          ),
      },
      logMeta: () => ({}),
    }
  },
  selectOne: ({ db, lang }, id) =>
    buildSelect(db as Kysely<DB>, lang)
      .query.where(sql.ref('ct.id') as any, '=', id)
      .executeTakeFirst(),
  mutations: {
    buildCreatePayload: (input, ctx) => {
      const userId = ctx.user?.id ?? null
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
      const userId = ctx.user?.id ?? null
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
