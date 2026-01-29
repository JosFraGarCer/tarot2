// server/api/base_card/_crud.ts
import { sql } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  baseCardQuerySchema,
  baseCardCreateSchema,
  baseCardUpdateSchema,
} from '@shared/schemas/entities/base-card'
import { buildTranslationSelect } from '../../utils/i18n'

function buildSelect(db: any, lang: string) {
  const base = db
    .selectFrom('base_card as c')
    .leftJoin('users as u', 'u.id', 'c.created_by')

  const { query, selects } = buildTranslationSelect(base, {
    baseAlias: 'c',
    translationTable: 'base_card_translations',
    foreignKey: 'card_id',
    lang,
    fields: ['name', 'short_text', 'description'],
  })

  const { query: queryCt, selects: selectsCt } = buildTranslationSelect(query, {
    baseAlias: 'c',
    translationTable: 'base_card_type_translations',
    foreignKey: 'card_type_id',
    lang,
    fields: { name: 'card_type_name' },
    aliasPrefix: 'ct',
  })

  return queryCt.select([
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
    ...selects,
    ...selectsCt,
    sql`u.username`.as('create_user'),
  ])
}

// Eager load tags for a list of card IDs - batch fetch to avoid N+1
async function eagerLoadTags(db: any, cardIds: number[], lang: string) {
  if (cardIds.length === 0) return new Map<number, Array<{id: number, name: string, language_code_resolved: string}>>()

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
      'tl.entity_id as card_id',
      'tg.id',
      ...selects,
    ])
    .where('tl.entity_type', '=', 'base_card')
    .where('tl.entity_id', 'in', cardIds)
    .execute()

  const tagMap = new Map<number, Array<{id: number, name: string, language_code_resolved: string}>>()
  for (const row of tagLinks) {
    const cid = row.card_id as number
    if (!tagMap.has(cid)) {
      tagMap.set(cid, [])
    }
    tagMap.get(cid)!.push({
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
  buildListQuery: ({ db, query, lang }) => {
    const tagsLower = query.tags?.map((tag: string) => tag.toLowerCase())
    const tagIds = query.tag_ids

    let base = buildSelect(db, lang)

    if (query.is_active !== undefined) {
      base = base.where('c.is_active', '=', query.is_active)
    }
    if (query.created_by !== undefined) {
      base = base.where('c.created_by', '=', query.created_by)
    }
    if (query.card_type_id !== undefined) {
      base = base.where('c.card_type_id', '=', query.card_type_id)
    }

    const tagIdsArray = Array.isArray(tagIds) ? tagIds : (tagIds !== undefined ? [tagIds] : [])
    if (tagIdsArray.length > 0) {
      base = base.where(sql`exists (
        select 1
        from tag_links tl
        where tl.entity_type = ${'base_card'}
          and tl.entity_id = c.id
          and tl.tag_id = any(${tagIdsArray as any})
      )`)
    }
    if (tagsLower && tagsLower.length > 0) {
      base = base.where(sql`exists (
        select 1
        from tag_links tl
        join tags t on t.id = tl.tag_id
        left join tags_translations tt_req on tt_req.tag_id = t.id and tt_req.language_code = ${lang}
        left join tags_translations tt_en on tt_en.tag_id = t.id and tt_en.language_code = 'en'
        where tl.entity_type = ${'base_card'}
          and tl.entity_id = c.id
          and lower(coalesce(tt_req.name, tt_en.name)) = any(${tagsLower as any})
      )`)
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
          name: sql`lower(coalesce(t_req_base_card_translations.name, t_en_base_card_translations.name))`,
          is_active: 'c.is_active',
          created_by: 'c.created_by',
          card_type_id: 'c.card_type_id',
        },
        applySearch: (qb, term) =>
          qb.where((eb: any) =>
            eb.or([
              sql`coalesce(t_req_base_card_translations.name, t_en_base_card_translations.name) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req_base_card_translations.short_text, t_en_base_card_translations.short_text) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req_base_card_translations.description, t_en_base_card_translations.description) ilike ${'%' + term + '%'}`,
              sql`c.code ilike ${'%' + term + '%'}`,
            ]),
          ),
      },
      transformRows: async (rows, ctx) => {
        const cardIds = rows.map((r: any) => r.id).filter((id: any) => id != null)
        const tagMap = await eagerLoadTags(ctx.db, cardIds, ctx.lang)
        return rows.map((row: any) => ({
          ...row,
          tags: tagMap.get(row.id) || [],
        }))
      },
      logMeta: ({ rows }) => ({
        tag_ids: tagIds ?? null,
        tags: tagsLower ?? null,
        count_tags: rows.reduce((acc: number, row: any) => acc + (Array.isArray(row?.tags) ? row.tags.length : 0), 0),
      }),
    }
  },
  selectOne: ({ db, lang }, id) =>
    buildSelect(db, lang)
      .where('c.id', '=', id)
      .executeTakeFirst(),
  mutations: {
    buildCreatePayload: (input, ctx) => {
      const userId = (ctx.event.context.user as any)?.id ?? null
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
      const userId = (ctx.event.context.user as any)?.id ?? null
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
