/* eslint-disable @typescript-eslint/no-explicit-any */
// server/api/arcana/_crud.ts
import { type Kysely, sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import { arcanaQuerySchema, arcanaCreateSchema, arcanaUpdateSchema } from '@shared/schemas/entities/arcana'
import { buildTranslationSelect } from '../../utils/i18n'
import type { DB } from '../../database/types'

function buildSelect(db: Kysely<DB>, lang: string) {
  const base = db
    .selectFrom('arcana as a')
    .leftJoin('users as u', 'u.id', 'a.created_by')

  const translation = buildTranslationSelect(base, {
    baseAlias: 'a',
    translationTable: 'arcana_translations',
    foreignKey: 'arcana_id',
    lang,
    fields: ['name', 'short_text', 'description'],
  })

  return {
    query: translation.query.select([
      'a.id',
      'a.code',
      'a.status',
      'a.is_active',
      'a.created_by',
      'a.image',
      'a.created_at',
      'a.modified_at',
      ...translation.selects,
      sql`u.username`.as('create_user'),
    ] as any[]),
    tReq: translation.tReq,
    tEn: translation.tEn,
  }
}

// Eager load tags for a list of arcana IDs - batch fetch to avoid N+1
async function eagerLoadTags(db: Kysely<DB>, arcanaIds: number[], lang: string) {
  if (arcanaIds.length === 0) return new Map<number, Array<{ id: number; name: string; language_code_resolved: string }>>()

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
      'tl.entity_id as arcana_id',
      'tg.id',
      ...selects,
    ] as any[])
    .where('tl.entity_type', '=', 'arcana')
    .where('tl.entity_id', 'in', arcanaIds)
    .execute()

  const tagMap = new Map<number, Array<{ id: number; name: string; language_code_resolved: string }>>()
  for (const row of tagLinks) {
    const aid = row.arcana_id as number
    if (!tagMap.has(aid)) {
      tagMap.set(aid, [])
    }
    tagMap.get(aid)!.push({
      id: row.id as number,
      name: row.name as string,
      language_code_resolved: row.language_code_resolved as string,
    })
  }
  return tagMap
}

export const arcanaCrud = createCrudHandlers({
  entity: 'arcana',
  baseTable: 'arcana',
  schema: {
    query: arcanaQuerySchema,
    create: arcanaCreateSchema,
    update: arcanaUpdateSchema,
  },
  translation: {
    table: 'arcana_translations',
    foreignKey: 'arcana_id',
    languageKey: 'language_code',
    defaultLang: 'en',
  },
  eagerLoad: [
    {
      key: 'tags',
      fetch: (db, ids, lang) => eagerLoadTags(db, ids, lang),
    },
  ],
  buildListQuery: ({ db, lang, query }) => {
    const tagsLower = query.tags?.map((tag: string) => tag.toLowerCase())
    const tagIds = query.tag_ids
    const { query: baseQuery, tReq, tEn } = buildSelect(db, lang)
    let base = baseQuery

    if (query.is_active !== undefined) {
      base = base.where(sql.ref('a.is_active') as any, '=', query.is_active)
    }
    if (query.created_by !== undefined) {
      base = base.where(sql.ref('a.created_by') as any, '=', query.created_by)
    }

    const tagIdsArray = Array.isArray(tagIds) ? tagIds : (tagIds !== undefined ? [tagIds] : [])
    if (tagIdsArray.length > 0) {
      base = base.where((eb: any) => eb.exists(
        eb.selectFrom('tag_links as tl')
          .select(['tl.tag_id'])
          .whereRef('tl.entity_id', '=', 'a.id' as any)
          .where('tl.entity_type', '=', 'arcana')
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
          .whereRef('tl.entity_id', '=', 'a.id' as any)
          .where('tl.entity_type', '=', 'arcana')
          .where(sql`lower(coalesce(tt_req.name, tt_en.name))`, 'in', tagsLower)
      ))
    }

    return {
      baseQuery: base,
      filters: {
        search: query.search ?? query.q,
        status: query.status,
        statusColumn: 'a.status',
        countDistinct: 'a.id',
        sort: { field: query.sort, direction: query.direction },
        defaultSort: { field: 'created_at', direction: 'desc' },
        sortColumnMap: {
          created_at: 'a.created_at',
          modified_at: 'a.modified_at',
          code: 'a.code',
          status: 'a.status',
          name: sql`lower(coalesce(${sql.ref(`${tReq}.name`)}, ${sql.ref(`${tEn}.name`)}))`,
          is_active: 'a.is_active',
          created_by: 'a.created_by',
        },
        applySearch: (qb, term) =>
          qb.where((eb: any) =>
            eb.or([
              sql`lower(coalesce(${sql.ref(`${tReq}.name`)}, ${sql.ref(`${tEn}.name`)})) ilike ${'%' + term + '%'}`,
              sql`lower(coalesce(${sql.ref(`${tReq}.short_text`)}, ${sql.ref(`${tEn}.short_text`)})) ilike ${'%' + term + '%'}`,
              sql`lower(a.code) ilike ${'%' + term + '%'}`,
            ] as any[]),
          ),
      },
      logMeta: ({ rows }) => ({
        tag_ids: tagIds ?? null,
        tags: tagsLower ?? null,
        count_tags: rows.reduce((acc: number, row: any) => acc + (Array.isArray(row.tags) ? row.tags.length : 0), 0),
      }),
    }
  },
  selectOne: ({ db, lang }, id) =>
    buildSelect(db as Kysely<DB>, lang)
      .query.where(sql.ref('a.id'), '=', id)
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
      return {
        baseData,
        translationData,
        lang: input.lang,
      }
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
      return {
        baseData,
        translationData,
        lang: input.lang,
      }
    },
  },
  logScope: 'arcana',
})
