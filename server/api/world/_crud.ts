/* eslint-disable @typescript-eslint/no-explicit-any */
// server/api/world/_crud.ts
import { type Kysely, sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  worldQuerySchema,
  worldCreateSchema,
  worldUpdateSchema,
} from '@shared/schemas/entities/world'
import { buildTranslationSelect } from '../../utils/i18n'
import type { DB } from '../../database/types'

function buildSelect(db: Kysely<DB>, lang: string) {
  const base = db
    .selectFrom('world as w')
    .leftJoin('users as u', 'u.id', 'w.created_by')

  const translation = buildTranslationSelect(base, {
    baseAlias: 'w',
    translationTable: 'world_translations',
    foreignKey: 'world_id',
    lang,
    fields: ['name', 'short_text', 'description'],
  })

  return {
    query: translation.query.select([
      'w.id',
      'w.code',
      'w.status',
      'w.is_active',
      'w.created_by',
      'w.image',
      'w.created_at',
      'w.modified_at',
      ...translation.selects,
      sql`u.username`.as('create_user'),
    ] as any[]),
    tReq: translation.tReq,
    tEn: translation.tEn,
  }
}

// Eager load tags for a list of world IDs - batch fetch to avoid N+1
async function eagerLoadTags(db: Kysely<DB>, worldIds: number[], lang: string) {
  if (worldIds.length === 0) return new Map<number, Array<{ id: number; name: string; language_code_resolved: string }>>()

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
      'tl.entity_id as world_id',
      'tg.id',
      ...selects,
    ] as any[])
    .where('tl.entity_type', '=', 'world')
    .where('tl.entity_id', 'in', worldIds)
    .execute()

  const tagMap = new Map<number, Array<{ id: number; name: string; language_code_resolved: string }>>()
  for (const row of tagLinks) {
    const wid = row.world_id as number
    if (!tagMap.has(wid)) {
      tagMap.set(wid, [])
    }
    tagMap.get(wid)!.push({
      id: row.id as number,
      name: row.name as string,
      language_code_resolved: row.language_code_resolved as string,
    })
  }
  return tagMap
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
  eagerLoad: [
    {
      key: 'tags',
      fetch: (db: any, ids: number[], lang: string) => eagerLoadTags(db, ids, lang),
    },
  ],
  buildListQuery: ({ db, query, lang }) => {
    const tagsLower = query.tags?.map((tag) => tag.toLowerCase())
    const tagIds = query.tag_ids
    const tagIdsArray = Array.isArray(tagIds) ? tagIds : (tagIds !== undefined ? [tagIds] : [])

    const { query: baseQuery, tReq, tEn } = buildSelect(db, lang)
    let base = baseQuery

    if (query.is_active !== undefined) {
      base = base.where(sql.ref('w.is_active') as any, '=', query.is_active)
    }
    if (query.created_by !== undefined) {
      base = base.where(sql.ref('w.created_by'), '=', query.created_by)
    }

    if (tagIdsArray.length > 0) {
      base = base.where((eb: any) => eb.exists(
        eb.selectFrom('tag_links as tl')
          .select(['tl.tag_id'])
          .whereRef('tl.entity_id', '=', sql.ref('w.id'))
          .where('tl.entity_type', '=', 'world')
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
          .whereRef('tl.entity_id', '=', sql.ref('w.id'))
          .where('tl.entity_type', '=', 'world')
          .where(sql`lower(coalesce(tt_req.name, tt_en.name))`, 'in', tagsLower)
      ))
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
          name: sql`lower(coalesce(${sql.ref(`${tReq}.name`)}, ${sql.ref(`${tEn}.name`)}))`,
          is_active: 'w.is_active',
          created_by: 'w.created_by',
        },
        applySearch: (qb, term) =>
          qb.where((eb) =>
            eb.or([
              sql`lower(coalesce(${sql.ref(`${tReq}.name`)}, ${sql.ref(`${tEn}.name`)})) ilike ${'%' + term + '%'}`,
              sql`lower(coalesce(${sql.ref(`${tReq}.short_text`)}, ${sql.ref(`${tEn}.short_text`)})) ilike ${'%' + term + '%'}`,
              sql`lower(coalesce(${sql.ref(`${tReq}.description`)}, ${sql.ref(`${tEn}.description`)})) ilike ${'%' + term + '%'}`,
              sql`w.code ilike ${'%' + term + '%'}`,
            ] as any[]),
          ),
      },
      logMeta: ({ rows }) => ({
        status: query.status ?? null,
        is_active: query.is_active ?? null,
        created_by: query.created_by ?? null,
        tag_ids: tagIds ?? null,
        tags: tagsLower ?? null,
        count_tags: rows.reduce((acc: number, row: any) => acc + (Array.isArray(row.tags) ? row.tags.length : 0), 0),
      }),
    }
  },
  selectOne: ({ db, lang }, id) =>
    buildSelect(db as Kysely<DB>, lang)
      .query.where(sql.ref('w.id') as any, '=', id)
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
  logScope: 'world',
})
