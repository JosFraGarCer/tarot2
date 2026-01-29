// server/api/tag/index.get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'kysely'
import { parseQuery } from '../../utils/parseQuery'
import { buildFilters } from '../../utils/filters'
import { createPaginatedResponse } from '../../utils/response'
import { getRequestedLanguage } from '../../utils/i18n'
import { tagQuerySchema } from '@shared/schemas/entities/tag'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  const logger = event.context.logger ?? globalThis.logger
  try {
    logger?.info?.({
      scope: 'tag.list.start',
      time: new Date().toISOString(),
    })
    const query = parseQuery(event, tagQuerySchema, { scope: 'tag.list.query' })
    const lang = getRequestedLanguage(query)
    const searchTerm = query.search ?? query.q ?? null

    const { query: baseQuery, tReq, tEn, selects } = buildTranslationSelect(globalThis.db.selectFrom('tags as t'), {
      baseAlias: 't',
      translationTable: 'tags_translations',
      foreignKey: 'tag_id',
      lang,
      fields: ['name', 'short_text', 'description'],
    })

    const { query: queryTp, selects: selectsTp } = buildTranslationSelect(baseQuery, {
      baseAlias: 't',
      translationTable: 'tags_translations',
      foreignKey: 'tag_id',
      lang,
      fields: { name: 'parent_name' },
      aliasPrefix: 'tp',
    })

    let base = queryTp
      .leftJoin('tags as tp', 'tp.id', 't.parent_id')
      .select([
        't.id',
        't.code',
        't.category',
        't.parent_id',
        't.sort',
        't.is_active',
        't.created_by',
        't.created_at',
        't.modified_at',
        ...selects,
        ...selectsTp,
      ])

    if (query.is_active !== undefined) base = base.where('t.is_active', '=', query.is_active)
    if (query.category !== undefined) base = base.where('t.category', '=', query.category)
    if (query.parent_id !== undefined) base = base.where('t.parent_id', '=', query.parent_id)
    if (query.parent_only === true) base = base.where('t.parent_id', 'is', null)

    const {
      query: filtered,
      totalItems,
      page,
      pageSize,
      resolvedSortField,
      resolvedSortDirection,
    } = await buildFilters(base, {
      page: query.page,
      pageSize: query.pageSize,
      search: searchTerm ?? undefined,
      status: undefined,
      applySearch: (qb, term) =>
        qb.where((eb) =>
          eb.or([
            sql`lower(coalesce(${sql.ref(`${tReq}.name`)}, ${sql.ref(`${tEn}.name`)})) ilike ${'%' + term + '%'}`,
            sql`lower(coalesce(${sql.ref(`${tReq}.short_text`)}, ${sql.ref(`${tEn}.short_text`)})) ilike ${'%' + term + '%'}`,
            sql`lower(coalesce(${sql.ref(`${tReq}.description`)}, ${sql.ref(`${tEn}.description`)})) ilike ${'%' + term + '%'}`,
            sql`t.code ilike ${'%' + term + '%'}`,
          ]),
        ),
      countDistinct: 't.id',
      sort: { field: query.sort, direction: query.direction },
      defaultSort: { field: 'created_at', direction: 'desc' },
      sortColumnMap: {
        created_at: 't.created_at',
        modified_at: 't.modified_at',
        code: 't.code',
        category: 't.category',
        name: sql`lower(coalesce(${sql.ref(`${tReq}.name`)}, ${sql.ref(`${tEn}.name`)}))`,
        is_active: 't.is_active',
        created_by: 't.created_by',
      },
    })

    const rows = await filtered.execute()

    logger?.info?.(
      {
        scope: 'tag.list',
        lang,
        page,
        pageSize,
        count: rows.length,
        totalItems,
        search: searchTerm,
        sort: resolvedSortField ?? 'created_at',
        direction: resolvedSortDirection ?? 'desc',
        category: query.category ?? null,
        parent_id: query.parent_id ?? null,
        is_active: query.is_active ?? null,
        timeMs: Date.now() - startedAt,
      },
      'Tags list completed',
    )

    return createPaginatedResponse(rows, totalItems, page, pageSize, {
      search: searchTerm,
      lang,
      extraMeta: {
        category: query.category ?? null,
        parent_id: query.parent_id ?? null,
        is_active: query.is_active ?? null,
      },
    })
  } catch (error) {
    logger?.error?.({ scope: 'tag.list', error: error instanceof Error ? error.message : String(error) }, 'Failed to list tags')
    throw error
  }
})
