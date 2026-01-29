// server/api/facet/_crud.ts
import { sql, type ExpressionBuilder } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  facetQuerySchema,
  facetCreateSchema,
  facetUpdateSchema,
} from '@shared/schemas/entities/facet'
import { buildTranslationSelect } from '../../utils/i18n'
import type { DB } from '../../database/types'

function buildSelect(db: any, lang: string) {
  const base = db
    .selectFrom('facet as f')
    .leftJoin('users as u', 'u.id', 'f.created_by')

  const { query, selects } = buildTranslationSelect(base, {
    baseAlias: 'f',
    translationTable: 'facet_translations',
    foreignKey: 'facet_id',
    lang,
    fields: ['name', 'short_text', 'description'],
  })

  const { query: queryAr, selects: selectsAr } = buildTranslationSelect(query, {
    baseAlias: 'f',
    translationTable: 'arcana_translations',
    foreignKey: 'arcana_id',
    lang,
    fields: { name: 'arcana' },
    aliasPrefix: 'ar',
  })

  return queryAr.select([
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
    ...selects,
    ...selectsAr,
    sql`u.username`.as('create_user'),
  ])
}

// Eager load tags for a list of facet IDs - batch fetch to avoid N+1
async function eagerLoadTags(db: any, facetIds: number[], lang: string) {
  if (facetIds.length === 0) return new Map<number, Array<{id: number, name: string, language_code_resolved: string}>>()

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
      'tl.entity_id as facet_id',
      'tg.id',
      ...selects,
    ])
    .where('tl.entity_type', '=', 'facet')
    .where('tl.entity_id', 'in', facetIds)
    .execute()

  const tagMap = new Map<number, Array<{id: number, name: string, language_code_resolved: string}>>()
  for (const row of tagLinks) {
    const fid = row.facet_id as number
    if (!tagMap.has(fid)) {
      tagMap.set(fid, [])
    }
    tagMap.get(fid)!.push({
      id: row.id as number,
      name: row.name as string,
      language_code_resolved: row.language_code_resolved as string,
    })
  }
  return tagMap
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

    const tagIdsArray = Array.isArray(tagIds) ? tagIds : (tagIds !== undefined ? [tagIds] : [])
    if (tagIdsArray.length > 0) {
      base = base.where((eb: ExpressionBuilder<DB, any>) => eb.exists(
        eb.selectFrom('tag_links as tl')
          .select(['tl.tag_id'])
          .whereRef('tl.entity_id', '=', 'f.id')
          .where('tl.entity_type', '=', 'facet')
          .where('tl.tag_id', 'in', tagIdsArray as any)
      ))
    }
    if (tagsLower && tagsLower.length > 0) {
      base = base.where((eb: ExpressionBuilder<DB, any>) => eb.exists(
        eb.selectFrom('tag_links as tl')
          .innerJoin('tags as t', 't.id', 'tl.tag_id')
          .leftJoin('tags_translations as tt_req', (join: any) =>
            join.onRef('tt_req.tag_id', '=', 't.id').on('tt_req.language_code', '=', lang),
          )
          .leftJoin('tags_translations as tt_en', (join: any) =>
            join.onRef('tt_en.tag_id', '=', 't.id').on('tt_en.language_code', '=', 'en'),
          )
          .select(['tl.tag_id'])
          .whereRef('tl.entity_id', '=', 'f.id')
          .where('tl.entity_type', '=', 'facet')
          .where(sql`lower(coalesce(tt_req.name, tt_en.name))`, 'in', tagsLower as any)
      ))
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
          name: sql`lower(coalesce(t_req_facet_translations.name, t_en_facet_translations.name))`,
          is_active: 'f.is_active',
          created_by: 'f.created_by',
          arcana_id: 'f.arcana_id',
        },
        applySearch: (qb, term) =>
          qb.where((eb: ExpressionBuilder<DB, any>) =>
            eb.or([
              sql`coalesce(t_req_facet_translations.name, t_en_facet_translations.name) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req_facet_translations.short_text, t_en_facet_translations.short_text) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req_facet_translations.description, t_en_facet_translations.description) ilike ${'%' + term + '%'}`,
              sql`f.code ilike ${'%' + term + '%'}`,
            ]),
          ),
      },
      transformRows: async (rows, ctx) => {
        const facetIds = rows.map((r: any) => r.id).filter((id: any) => id != null)
        const tagMap = await eagerLoadTags(ctx.db, facetIds, ctx.lang)
        return rows.map((row: any) => ({
          ...row,
          tags: tagMap.get(row.id) || [],
        }))
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
      const baseData = {
        code: input.code,
        arcana_id: input.arcana_id,
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
      const userId = (ctx.event.context.user as any)?.id ?? null
      const baseData = {
        code: input.code,
        arcana_id: input.arcana_id,
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
  logScope: 'facet',
})
