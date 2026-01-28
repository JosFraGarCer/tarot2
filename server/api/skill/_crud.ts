// server/api/skill/_crud.ts
import { sql, type ExpressionBuilder } from 'kysely'
import { createCrudHandlers } from '../../utils/createCrudHandlers'
import {
  skillQuerySchema,
  skillCreateSchema,
  skillUpdateSchema,
} from '@shared/schemas/entities/skill'
import { buildTranslationSelect } from '../../utils/i18n'
import type { DB } from '../../database/types'

function buildSelect(db: any, lang: string) {
  const base = db
    .selectFrom('base_skills as s')
    .leftJoin('users as u', 'u.id', 's.created_by')

  const { query, selects } = buildTranslationSelect(base, {
    baseAlias: 's',
    translationTable: 'base_skills_translations',
    foreignKey: 'base_skill_id',
    lang,
    fields: ['name', 'short_text', 'description'],
  })

  const { query: queryFt, selects: selectsFt } = buildTranslationSelect(query, {
    baseAlias: 's',
    translationTable: 'facet_translations',
    foreignKey: 'facet_id',
    lang,
    fields: { name: 'facet' },
    aliasPrefix: 'ft',
  })

  return queryFt.select([
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
    ...selects,
    ...selectsFt,
    sql`u.username`.as('create_user'),
  ])
}

// Eager load tags for a list of skill IDs - batch fetch to avoid N+1
async function eagerLoadTags(db: DB, skillIds: number[], lang: string) {
  if (skillIds.length === 0) return new Map<number, Array<{id: number, name: string, language_code_resolved: string}>>()

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
    ])
    .where('tl.entity_type', '=', 'base_skills')
    .where('tl.entity_id', 'in', skillIds)
    .execute()

  const tagMap = new Map<number, Array<{id: number, name: string, language_code_resolved: string}>>()
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
  buildListQuery: ({ db, query, lang }) => {
    const tagsLower = query.tags?.map((tag: string) => tag.toLowerCase())
    const tagIds = query.tag_ids

    let base = buildSelect(db, lang)

    if (query.is_active !== undefined) {
      base = base.where('s.is_active', '=', query.is_active)
    }
    if (query.created_by !== undefined) {
      base = base.where('s.created_by', '=', query.created_by)
    }
    if (query.facet_id !== undefined) {
      base = base.where('s.facet_id', '=', query.facet_id)
    }

    if (tagIds && tagIds.length > 0) {
      base = base.where(sql`exists (
        select 1
        from tag_links tl
        where tl.entity_type = ${'base_skills'}
          and tl.entity_id = s.id
          and tl.tag_id = any(${tagIds as any})
      )`)
    }
    if (tagsLower && tagsLower.length > 0) {
      base = base.where(sql`exists (
        select 1
        from tag_links tl
        join tags t on t.id = tl.tag_id
        left join tags_translations tt_req on tt_req.tag_id = t.id and tt_req.language_code = ${lang}
        left join tags_translations tt_en on tt_en.tag_id = t.id and tt_en.language_code = 'en'
        where tl.entity_type = ${'base_skills'}
          and tl.entity_id = s.id
          and lower(coalesce(tt_req.name, tt_en.name)) = any(${tagsLower as any})
      )`)
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
          name: sql`lower(coalesce(t_req_base_skills_translations.name, t_en_base_skills_translations.name))`,
          is_active: 's.is_active',
          created_by: 's.created_by',
          facet_id: 's.facet_id',
        },
        applySearch: (qb, term) =>
          qb.where((eb: ExpressionBuilder<DB, any>) =>
            eb.or([
              sql`coalesce(t_req_base_skills_translations.name, t_en_base_skills_translations.name) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req_base_skills_translations.short_text, t_en_base_skills_translations.short_text) ilike ${'%' + term + '%'}`,
              sql`coalesce(t_req_base_skills_translations.description, t_en_base_skills_translations.description) ilike ${'%' + term + '%'}`,
              sql`s.code ilike ${'%' + term + '%'}`,
            ]),
          ),
      },
      transformRows: async (rows, ctx) => {
        const skillIds = rows.map((r: any) => r.id).filter((id: any) => id != null)
        const tagMap = await eagerLoadTags(ctx.db, skillIds, ctx.lang)
        return rows.map((row: any) => ({
          ...row,
          tags: tagMap.get(row.id) || [],
        }))
      },
      logMeta: ({ rows }) => ({
        facet_id: query.facet_id ?? null,
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
      .where('s.id', '=', id)
      .executeTakeFirst(),
  mutations: {
    buildCreatePayload: (input, ctx) => {
      const userId = (ctx.event.context.user as any)?.id ?? null
      const baseData = {
        code: input.code,
        facet_id: input.facet_id,
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
        facet_id: input.facet_id,
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
  logScope: 'skill',
})
