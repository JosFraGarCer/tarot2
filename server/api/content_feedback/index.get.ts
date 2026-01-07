// server/api/content_feedback/index.get.ts
import { defineEventHandler, getValidatedQuery } from 'h3'
import { sql, type SelectQueryBuilder } from 'kysely'
import { createPaginatedResponse } from '../../utils/response'
import { buildFilters } from '../../utils/filters'
import { contentFeedbackQuerySchema } from '../../schemas/content-feedback'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic query builder requires flexible types
function applyEntityRelation<QB extends SelectQueryBuilder<any, any, any>>(qb: QB, relationRaw: string | undefined): QB {
  if (!relationRaw) return qb
  const key = relationRaw.replace(/\s+/g, '').toLowerCase()
  switch (key) {
    case 'world->base_card':
    case 'world:base_card':
      return qb
        .leftJoin('world_card as wc_rel', (join) =>
          join
            .onRef('wc_rel.id', '=', 'cf.entity_id')
            .on('cf.entity_type', '=', sql`'world_card'`),
        )
        .leftJoin('world as w_rel', 'w_rel.id', 'wc_rel.world_id')
        .leftJoin('base_card as bc_rel', 'bc_rel.id', 'wc_rel.base_card_id')
    default:
      return qb
  }
}

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const parsed = await getValidatedQuery(event, contentFeedbackQuerySchema.parse)
    const {
      page,
      pageSize,
      search,
      entity_type,
      entity_id,
      version_number,
      language_code,
      status,
      category,
      created_by,
      resolved_by,
      has_resolution,
      created_from,
      created_to,
      resolved_from,
      resolved_to,
      entity_relation,
      sort,
      direction,
    } = parsed

    let base = globalThis.db
      .selectFrom('content_feedback as cf')
      .leftJoin('users as cu', 'cu.id', 'cf.created_by')
      .leftJoin('users as ru', 'ru.id', 'cf.resolved_by')
      .select([
        'cf.id',
        'cf.entity_type',
        'cf.entity_id',
        'cf.version_number',
        'cf.language_code',
        'cf.comment',
        'cf.category',
        'cf.status',
        'cf.created_by',
        'cf.resolved_by',
        'cf.created_at',
        'cf.resolved_at',
        sql`coalesce(cu.username, cu.email)`.as('created_by_name'),
        sql`coalesce(ru.username, ru.email)`.as('resolved_by_name'),
      ])

    if (entity_type) base = base.where('cf.entity_type', '=', entity_type)
    if (entity_id !== undefined) base = base.where('cf.entity_id', '=', entity_id)
    if (version_number !== undefined) base = base.where('cf.version_number', '=', version_number)
    if (language_code) base = base.where('cf.language_code', '=', language_code)
    if (status) base = base.where('cf.status', '=', status)
    if (category) base = base.where('cf.category', '=', category)
    if (created_by !== undefined) base = base.where('cf.created_by', '=', created_by)
    if (resolved_by !== undefined) base = base.where('cf.resolved_by', '=', resolved_by)
    if (has_resolution !== undefined) {
      base = has_resolution
        ? base.where((eb) => eb.or([eb('cf.resolved_at', 'is not', null), eb('cf.resolved_by', 'is not', null)]))
        : base.where((eb) => eb.and([eb('cf.resolved_at', 'is', null), eb('cf.resolved_by', 'is', null)]))
    }

    base = applyEntityRelation(base, entity_relation)

    const createdRange = created_from || created_to ? { from: created_from, to: created_to } : undefined
    const resolvedRange = resolved_from || resolved_to ? { from: resolved_from, to: resolved_to } : undefined

    const { query, totalItems, page: currentPage, pageSize: currentSize, resolvedSortField, resolvedSortDirection } =
      await buildFilters(base, {
        page,
        pageSize,
        search,
        status,
        applySearch: (qb, s) =>
          qb.where((eb) =>
            eb.or([
              eb('cf.comment', 'ilike', `%${s}%`),
              eb('cf.category', 'ilike', `%${s}%`),
              eb('cf.entity_type', 'ilike', `%${s}%`),
            ]),
          ),
        sort: { field: sort, direction },
        defaultSort: { field: 'created_at', direction: 'desc' },
        sortColumnMap: {
          created_at: 'cf.created_at',
          resolved_at: 'cf.resolved_at',
          status: 'cf.status',
          entity: sql`cf.entity_type`,
          version_number: 'cf.version_number',
        },
        countDistinct: 'cf.id',
        createdRange,
        createdColumn: sql`cf.created_at`,
        resolvedRange,
        resolvedColumn: sql`cf.resolved_at`,
      })

    const rows = await query.execute()

    globalThis.logger?.info('Content feedback listed', {
      page: currentPage,
      pageSize: currentSize,
      count: rows.length,
      sort: resolvedSortField ?? 'created_at',
      direction: resolvedSortDirection ?? 'desc',
      timeMs: Date.now() - startedAt,
    })

    return createPaginatedResponse(rows, totalItems, currentPage, currentSize, search ?? null)
  } catch (error) {
    globalThis.logger?.error('Failed to list content feedback', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
