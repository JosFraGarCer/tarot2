// server/api/arcana/_crud.ts
import { sql, type ExpressionBuilder } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import { arcanaQuerySchema, arcanaCreateSchema, arcanaUpdateSchema } from '@shared/schemas/entities/arcana'
import { buildTranslationSelect } from '../../utils/i18n'
import type { DB } from '../../database/types'

function buildSelect(db: any, lang: string) {
  const base = db
    .selectFrom('arcana as a')
    .leftJoin('users as u', 'u.id', 'a.created_by')

  const { query, selects } = buildTranslationSelect(base, {
    baseAlias: 'a',
    translationTable: 'arcana_translations',
    foreignKey: 'arcana_id',
    lang,
    fields: ['name', 'short_text', 'description'],
  })

  return query.select([
    'a.id',
    'a.code',
    'a.status',
    'a.is_active',
    'a.created_by',
    'a.image',
    'a.created_at',
    'a.modified_at',
    ...selects,
    sql`u.username`.as('create_user'),
  ])
}

// Eager load tags for a list of arcana IDs - batch fetch to avoid N+1
async function eagerLoadTags(db: any, arcanaIds: number[], lang: string) {
  if (arcanaIds.length === 0) return new Map<number, Array<{id: number, name: string, language_code_resolved: string}>>()

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
    ])
    .where('tl.entity_type', '=', 'arcana')
    .where('tl.entity_id', 'in', arcanaIds)
    .execute()

  const tagMap = new Map<number, Array<{id: number, name: string, language_code_resolved: string}>>()
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
  buildListQuery: ({ db, lang, query }) => {
    const tagsLower = query.tags?.map((tag: string) => tag.toLowerCase())
    const tagIds = query.tag_ids
    let base = buildSelect(db, lang)

    if (query.is_active !== undefined) {
      base = base.where('a.is_active', '=', query.is_active)
    }
    if (query.created_by !== undefined) {
      base = base.where('a.created_by', '=', query.created_by)
    }

    const tagIdsArray = Array.isArray(tagIds) ? tagIds : (tagIds !== undefined ? [tagIds] : [])
    if (tagIdsArray.length > 0) {
      base = base.where((eb: ExpressionBuilder<DB, any>) => eb.exists(
        eb.selectFrom('tag_links as tl')
          .select(['tl.tag_id'])
          .whereRef('tl.entity_id', '=', 'a.id')
          .where('tl.entity_type', '=', 'arcana')
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
          .whereRef('tl.entity_id', '=', 'a.id')
          .where('tl.entity_type', '=', 'arcana')
          .where(sql`lower(coalesce(tt_req.name, tt_en.name))`, 'in', tagsLower as any)
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
          name: sql`lower(coalesce(t_req_arcana_translations.name, t_en_arcana_translations.name))`,
          is_active: 'a.is_active',
          created_by: 'a.created_by',
        },
        applySearch: (qb, term) =>
          qb.where((eb) =>
            eb.or([
              sql`lower(coalesce(t_req_arcana_translations.name, t_en_arcana_translations.name)) ilike ${'%' + term + '%'}`,
              sql`lower(coalesce(t_req_arcana_translations.short_text, t_en_arcana_translations.short_text)) ilike ${'%' + term + '%'}`,
              sql`lower(a.code) ilike ${'%' + term + '%'}`,
            ]),
          ),
      },
      transformRows: async (rows, ctx) => {
        // Eager load tags in batch instead of N+1 subqueries
        const arcanaIds = rows.map((r: any) => r.id).filter((id: any) => id != null)
        const tagMap = await eagerLoadTags(ctx.db, arcanaIds, ctx.lang)
        return rows.map((row: any) => ({
          ...row,
          tags: tagMap.get(row.id) || [],
        }))
      },
      logMeta: ({ rows }) => ({
        tag_ids: tagIds ?? null,
        tags: tagsLower ?? null,
        count_tags: rows.reduce((acc, row: any) => acc + (Array.isArray(row?.tags) ? row.tags.length : 0), 0),
      }),
    }
  },
  selectOne: ({ db, lang }, id) =>
    buildSelect(db, lang)
      .where('a.id', '=', id)
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
      return {
        baseData,
        translationData,
        lang: input.lang,
      }
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
      return {
        baseData,
        translationData,
        lang: input.lang,
      }
    },
  },
  logScope: 'arcana',
})
