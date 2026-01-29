/* eslint-disable @typescript-eslint/no-explicit-any */
// server/api/skill/_crud.ts
import { type Kysely, sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  skillQuerySchema,
  skillCreateSchema,
  skillUpdateSchema,
} from '@shared/schemas/entities/skill'
import { buildTranslationSelect } from '../../utils/i18n'
import type { DB } from '../../database/types'

function buildSelect(db: Kysely<DB>, lang: string) {
  const base = db
    .selectFrom('base_skills as s')
    .leftJoin('users as u', 'u.id', 's.created_by')

  const translation = buildTranslationSelect(base, {
    baseAlias: 's',
    translationTable: 'base_skills_translations',
    foreignKey: 'base_skill_id',
    lang,
    fields: ['name', 'short_text', 'description'],
  })

  const translationFa = buildTranslationSelect(translation.query, {
    baseAlias: 's',
    translationTable: 'facet_translations',
    foreignKey: 'facet_id',
    lang,
    fields: { name: 'facet' },
    aliasPrefix: 'fa',
  })

  return {
    query: translationFa.query.select([
      's.id',
      's.code',
      's.facet_id',
      's.status',
      's.is_active',
      's.created_by',
      's.image',
      's.legacy_effects',
      sql`coalesce(s.effects, '{}'::jsonb)`.as('effects'),
      's.created_at',
      's.modified_at',
      ...translation.selects,
      ...translationFa.selects,
      sql`u.username`.as('create_user'),
    ] as any[]),
    tReq: translationFa.tReq,
    tEn: translationFa.tEn,
  }
}

// Eager load tags for a list of skill IDs - batch fetch to avoid N+1
async function eagerLoadTags(db: Kysely<DB>, skillIds: number[], lang: string) {
  if (skillIds.length === 0) return new Map<number, Array<{ id: number; name: string; language_code_resolved: string }>>()

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
      'tl.entity_id as skill_id',
      'tg.id',
      ...selects,
    ] as any[])
    .where('tl.entity_type', '=', 'base_skills')
    .where('tl.entity_id', 'in', skillIds)
    .execute()

  const tagMap = new Map<number, Array<{ id: number; name: string; language_code_resolved: string }>>()
  for (const row of tagLinks) {
    const sid = row.skill_id as number
    if (!tagMap.has(sid)) {
      tagMap.set(sid, [])
    }
    tagMap.get(sid)!.push({
      id: row.id as number,
      name: row.name as string,
      language_code_resolved: row.language_code_resolved as string,
    })
  }
  return tagMap
}

export const skillCrud = createCrudHandlers({
  entity: 'skill',
  baseTable: 'base_skills',
  schema: {
    query: skillQuerySchema,
    create: skillCreateSchema,
    update: skillUpdateSchema,
  },
  translation: {
    table: 'base_skills_translations',
    foreignKey: 'base_skill_id',
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
    const tagsLower = query.tags?.map((tag) => tag.toLowerCase())
    const tagIds = query.tag_ids

    const { query: baseQuery, tReq, tEn } = buildSelect(db, lang)
    let base = baseQuery

    if (query.is_active !== undefined) {
      base = base.where(sql.ref('s.is_active') as any, '=', query.is_active)
    }
    if (query.facet_id !== undefined) {
      base = base.where(sql.ref('s.facet_id') as any, '=', query.facet_id)
    }
    if (query.created_by !== undefined) {
      base = base.where(sql.ref('s.created_by'), '=', query.created_by)
    }

    const tagIdsArray = Array.isArray(tagIds) ? tagIds : (tagIds !== undefined ? [tagIds] : [])
    if (tagIdsArray.length > 0) {
      base = base.where((eb: any) => eb.exists(
        eb.selectFrom('tag_links as tl')
          .select(['tl.tag_id'])
          .whereRef('tl.entity_id', '=', sql.ref('s.id') as any)
          .where('tl.entity_type', '=', 'base_skills')
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
          .whereRef('tl.entity_id', '=', sql.ref('s.id') as any)
          .where('tl.entity_type', '=', 'base_skills')
          .where(sql`lower(coalesce(tt_req.name, tt_en.name))`, 'in', tagsLower)
      ))
    }

    return {
      baseQuery: base,
      filters: {
        search: query.search ?? query.q,
        status: query.status,
        statusColumn: 's.status',
        countDistinct: 's.id',
        sort: { field: query.sort, direction: query.direction },
        defaultSort: { field: 'created_at', direction: 'desc' },
        sortColumnMap: {
          created_at: 's.created_at',
          modified_at: 's.modified_at',
          code: 's.code',
          status: 's.status',
          name: sql`lower(coalesce(${sql.ref(`${tReq}.name`)}, ${sql.ref(`${tEn}.name`)}))`,
          is_active: 's.is_active',
          created_by: 's.created_by',
          facet_id: 's.facet_id',
        },
        applySearch: (qb, term) =>
          qb.where((eb) =>
            eb.or([
              sql`lower(coalesce(${sql.ref(`${tReq}.name`)}, ${sql.ref(`${tEn}.name`)})) ilike ${'%' + term + '%'}`,
              sql`lower(coalesce(${sql.ref(`${tReq}.short_text`)}, ${sql.ref(`${tEn}.short_text`)})) ilike ${'%' + term + '%'}`,
              sql`lower(coalesce(${sql.ref(`${tReq}.description`)}, ${sql.ref(`${tEn}.description`)})) ilike ${'%' + term + '%'}`,
              sql`s.code ilike ${'%' + term + '%'}`,
            ]),
          ),
      },
      logMeta: ({ rows }) => ({
        facet_id: query.facet_id ?? null,
        tag_ids: tagIds ?? null,
        tags: tagsLower ?? null,
        count_tags: rows.reduce(
          (acc: number, row: any) => acc + (Array.isArray(row.tags) ? row.tags.length : 0),
          0,
        ),
      }),
    }
  },
  selectOne: ({ db, lang }, id) =>
    buildSelect(db as Kysely<DB>, lang)
      .query.where(sql.ref('s.id') as any, '=', id)
      .executeTakeFirst(),
  mutations: {
    buildCreatePayload: (input, ctx) => {
      const userId = ctx.user?.id ?? null
      const baseData = {
        code: input.code,
        facet_id: input.facet_id,
        image: input.image ?? null,
        status: input.status,
        is_active: input.is_active,
        legacy_effects: input.legacy_effects,
        effects: input.effects ?? {},
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
        facet_id: input.facet_id,
        image: input.image ?? null,
        status: input.status,
        is_active: input.is_active,
        legacy_effects: input.legacy_effects,
        effects: input.effects,
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
  logScope: 'skill',
})
