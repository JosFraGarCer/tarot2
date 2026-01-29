/* eslint-disable @typescript-eslint/no-explicit-any */
// server/api/world_card/_crud.ts
import { type Kysely, sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  worldCardQuerySchema,
  worldCardCreateSchema,
  worldCardUpdateSchema,
} from '@shared/schemas/entities/world-card'
import { buildTranslationSelect } from '../../utils/i18n'
import type { DB } from '../../database/types'

function buildSelect(db: Kysely<DB>, lang: string) {
  const base = db
    .selectFrom('world_card as wc')
    .leftJoin('users as u', 'u.id', 'wc.created_by')
    .leftJoin('world as w', 'w.id', 'wc.world_id')
    .leftJoin('base_card as bc', 'bc.id', 'wc.base_card_id')

  const translationWc = buildTranslationSelect(base, {
    baseAlias: 'wc',
    translationTable: 'world_card_translations',
    foreignKey: 'card_id',
    lang,
    fields: ['name', 'short_text', 'description'],
  })

  const translationW = buildTranslationSelect(translationWc.query, {
    baseAlias: 'w',
    translationTable: 'world_translations',
    foreignKey: 'world_id',
    lang,
    fields: { name: 'world_name' },
    aliasPrefix: 'wt',
  })

  const translationBc = buildTranslationSelect(translationW.query, {
    baseAlias: 'bc',
    translationTable: 'base_card_translations',
    foreignKey: 'card_id',
    lang,
    fields: { name: 'base_card_name' },
    aliasPrefix: 'bc',
  })

  return {
    query: translationBc.query.select([
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
      ...translationWc.selects,
      'w.code as world_code',
      ...translationW.selects,
      'bc.code as base_card_code',
      ...translationBc.selects,
      sql`u.username`.as('create_user'),
    ] as any[]),
    tReq: translationWc.tReq,
    tEn: translationWc.tEn,
  }
}

// Eager load tags for a list of world_card IDs - batch fetch to avoid N+1
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
    .where('tl.entity_type', '=', 'world_card')
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
  eagerLoad: [
    {
      key: 'tags',
      fetch: (db, ids, lang) => eagerLoadTags(db, ids, lang),
    },
  ],
  buildListQuery: ({ db, query, lang }) => {
    const tagsLower = query.tags?.map((tag: string) => tag.toLowerCase())
    const tagIds = query.tag_ids

    const { query: baseQuery, tReq, tEn } = buildSelect(db, lang)
    let base = baseQuery

    if (query.is_active !== undefined) {
      base = base.where(sql.ref('wc.is_active'), '=', query.is_active)
    }
    if (query.created_by !== undefined) {
      base = base.where(sql.ref('wc.created_by'), '=', query.created_by)
    }
    if (query.world_id !== undefined) {
      base = base.where(sql.ref('wc.world_id'), '=', query.world_id)
    }

    const tagIdsArray = Array.isArray(tagIds) ? tagIds : (tagIds !== undefined ? [tagIds] : [])
    if (tagIdsArray.length > 0) {
      base = base.where((eb) => eb.exists(
        eb.selectFrom('tag_links as tl')
          .select(['tl.tag_id'])
          .whereRef('tl.entity_id', '=', 'wc.id')
          .where('tl.entity_type', '=', 'world_card')
          .where('tl.tag_id', 'in', tagIdsArray)
      ))
    }

    if (tagsLower && tagsLower.length > 0) {
      base = base.where((eb) => eb.exists(
        eb.selectFrom('tag_links as tl')
          .innerJoin('tags as t', 't.id', 'tl.tag_id')
          .leftJoin('tags_translations as tt_req', (join) =>
            join.onRef('tt_req.tag_id', '=', 't.id').on('tt_req.language_code', '=', lang),
          )
          .leftJoin('tags_translations as tt_en', (join) =>
            join.onRef('tt_en.tag_id', '=', 't.id').on('tt_en.language_code', '=', 'en'),
          )
          .select(['tl.tag_id'])
          .whereRef('tl.entity_id', '=', 'wc.id')
          .where('tl.entity_type', '=', 'world_card')
          .where(sql`lower(coalesce(tt_req.name, tt_en.name))`, 'in', tagsLower)
      ))
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
          name: sql`lower(coalesce(${sql.ref(`${tReq}.name`)}, ${sql.ref(`${tEn}.name`)}))`,
          is_active: 'wc.is_active',
          created_by: 'wc.created_by',
          world_id: 'wc.world_id',
          base_card_id: 'wc.base_card_id',
        },
        applySearch: (qb, term) =>
          qb.where((eb: any) =>
            eb.or([
              sql`lower(coalesce(${sql.ref(`${tReq}.name`)}, ${sql.ref(`${tEn}.name`)})) ilike ${'%' + term + '%'}`,
              sql`lower(coalesce(${sql.ref(`${tReq}.short_text`)}, ${sql.ref(`${tEn}.short_text`)})) ilike ${'%' + term + '%'}`,
              sql`lower(coalesce(${sql.ref(`${tReq}.description`)}, ${sql.ref(`${tEn}.description`)})) ilike ${'%' + term + '%'}`,
              sql`wc.code ilike ${'%' + term + '%'}`,
            ] as any[]),
          ),
      },
      logMeta: ({ rows }) => ({
        world_id: query.world_id ?? null,
        base_card_id: query.base_card_id ?? null,
        tag_ids: tagIds ?? null,
        tags: tagsLower ?? null,
        count_tags: rows.reduce((acc, row) => acc + (Array.isArray(row.tags) ? row.tags.length : 0), 0),
      }),
    }
  },
  selectOne: ({ db, lang }, id) =>
    buildSelect(db as Kysely<DB>, lang)
      .query
      .where(sql.ref('wc.id') as any, '=', id)
      .executeTakeFirst(),
  mutations: {
    buildCreatePayload: (input, ctx) => {
      const userId = ctx.user?.id ?? null
      const baseData = {
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
        world_id: input.world_id,
        base_card_id: input.base_card_id ?? null,
        is_override: input.is_override ?? null,
        status: input.status,
        is_active: input.is_active,
        image: input.image ?? null,
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
  logScope: 'world_card',
})
