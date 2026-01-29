/* eslint-disable @typescript-eslint/no-explicit-any */
// server/api/base_card/_crud.ts
import { type Kysely, sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  baseCardQuerySchema,
  baseCardCreateSchema,
  baseCardUpdateSchema,
} from '@shared/schemas/entities/base-card'
import { buildTranslationSelect } from '../../utils/i18n'
import type { DB } from '../../database/types'

function buildSelect(db: Kysely<DB>, lang: string) {
  const base = db
    .selectFrom('base_card as c')
    .leftJoin('users as u', 'u.id', 'c.created_by')

  const translation = buildTranslationSelect(base, {
    baseAlias: 'c',
    translationTable: 'base_card_translations',
    foreignKey: 'card_id',
    lang,
    fields: ['name', 'short_text', 'description'],
  })

  const translationCt = buildTranslationSelect(translation.query, {
    baseAlias: 'c',
    translationTable: 'base_card_type_translations',
    foreignKey: 'card_type_id',
    lang,
    fields: { name: 'card_type_name' },
    aliasPrefix: 'ct',
  })

  return {
    query: translationCt.query.select([
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
      ...translation.selects,
      ...translationCt.selects,
      sql`u.username`.as('create_user'),
    ] as any[]),
    tReq: translation.tReq,
    tEn: translation.tEn,
  }
}

// Eager load tags for a list of card IDs - batch fetch to avoid N+1
async function eagerLoadTags(db: Kysely<DB>, cardIds: number[], lang: string) {
  if (cardIds.length === 0) return new Map<number, Array<{ id: number; name: string; language_code_resolved: string }>>()

  const { query, selects } = buildTranslationSelect(
    db.selectFrom('tag_links as tl')
      .innerJoin('tags as tg', 'tg.id', 'tl.tag_id'),
    {
      baseAlias: 'tg',
      translationTable: 'tags_translations',
      foreignKey: 'tag_id',
      lang,
      fields: ['name'],
    }
  )

  const tagLinks = await query
    .select([
      'tl.entity_id',
      'tg.id',
      ...selects,
    ] as any[])
    .where('tl.entity_type', '=', 'base_card')
    .where('tl.entity_id', 'in', cardIds)
    .execute()

  const tagMap = new Map<number, Array<{ id: number; name: string; language_code_resolved: string }>>()
  for (const row of tagLinks) {
    const cardId = row.entity_id as number
    if (!tagMap.has(cardId)) {
      tagMap.set(cardId, [])
    }
    tagMap.get(cardId)!.push({
      id: row.id as number,
      name: row.name as string,
      language_code_resolved: row.language_code_resolved as string,
    })
  }
  return tagMap
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
  eagerLoad: [
    {
      key: 'tags',
      fetch: (db: any, ids: number[], lang: string) => eagerLoadTags(db, ids, lang),
    },
  ],
  buildListQuery: ({ db, query, lang }) => {
    const tagsLower = query.tags?.map((tag: string) => tag.toLowerCase())
    const tagIds = query.tag_ids

    const { query: baseQuery, tReq, tEn } = buildSelect(db, lang)
    let base = baseQuery

    if (query.is_active !== undefined) {
      base = base.where(sql.ref('c.is_active') as any, '=', query.is_active)
    }
    if (query.created_by !== undefined) {
      base = base.where(sql.ref('c.created_by') as any, '=', query.created_by)
    }
    if (query.card_type_id !== undefined) {
      base = base.where(sql.ref('c.card_type_id') as any, '=', query.card_type_id)
    }

    const tagIdsArray = Array.isArray(tagIds) ? tagIds : (tagIds !== undefined ? [tagIds] : [])
    if (tagIdsArray.length > 0) {
      base = base.where((eb: any) => eb.exists(
        eb.selectFrom('tag_links as tl')
          .select(['tl.tag_id'])
          .whereRef('tl.entity_id', '=', sql.ref('c.id') as any)
          .where('tl.entity_type', '=', 'base_card')
          .where('tl.tag_id', 'in', tagIdsArray)
      ))
    }
    if (tagsLower && tagsLower.length > 0) {
      base = base.where((eb: any) => eb.exists(
        eb.selectFrom('tag_links as tl')
          .innerJoin('tags as t', 't.id', 'tl.tag_id')
          .leftJoin('tags_translations as tt_req', (join: any) =>
            join.onRef('tt_req.tag_id', '=', 't.id').on('tt_req.language_code', '=', lang),
          )
          .leftJoin('tags_translations as tt_en', (join: any) =>
            join.onRef('tt_en.tag_id', '=', 't.id').on('tt_en.language_code', '=', 'en'),
          )
          .select(['tl.tag_id'])
          .whereRef('tl.entity_id', '=', sql.ref('c.id') as any)
          .where('tl.entity_type', '=', 'base_card')
          .where(sql`lower(coalesce(tt_req.name, tt_en.name))`, 'in', tagsLower)
      ))
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
          name: sql`lower(coalesce(${sql.ref(`${tReq}.name`)}, ${sql.ref(`${tEn}.name`)}))`,
          is_active: 'c.is_active',
          created_by: 'c.created_by',
          card_type_id: 'c.card_type_id',
        },
        applySearch: (qb, term) =>
          qb.where((eb: any) =>
            eb.or([
              sql`lower(coalesce(${sql.ref(`${tReq}.name`)}, ${sql.ref(`${tEn}.name`)})) ilike ${'%' + term + '%'}`,
              sql`lower(coalesce(${sql.ref(`${tReq}.short_text`)}, ${sql.ref(`${tEn}.short_text`)})) ilike ${'%' + term + '%'}`,
              sql`lower(coalesce(${sql.ref(`${tReq}.description`)}, ${sql.ref(`${tEn}.description`)})) ilike ${'%' + term + '%'}`,
              sql`c.code ilike ${'%' + term + '%'}`,
            ]),
          ),
      },
      logMeta: ({ rows }) => ({
        tag_ids: tagIds ?? null,
        tags: tagsLower ?? null,
        count_tags: rows.reduce((acc, row) => acc + (Array.isArray(row.tags) ? row.tags.length : 0), 0),
      }),
    }
  },
  selectOne: ({ db, lang }, id) =>
    buildSelect(db as Kysely<DB>, lang)
      .query.where(sql.ref('c.id'), '=', id)
      .executeTakeFirst(),
  mutations: {
    buildCreatePayload: (input, ctx) => {
      const userId = ctx.user?.id ?? null
      const baseData = {
        code: input.code,
        card_type_id: input.card_type_id,
        card_family: input.card_family,
        image: input.image ?? null,
        status: input.status,
        is_active: input.is_active,
        legacy_effects: input.legacy_effects,
        effects: input.effects ?? null,
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
        card_type_id: input.card_type_id,
        image: input.image ?? null,
        status: input.status,
        is_active: input.is_active,
        legacy_effects: input.legacy_effects,
        effects: input.effects ?? null,
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
  logScope: 'base_card',
})
