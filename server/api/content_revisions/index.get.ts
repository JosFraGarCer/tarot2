// server/api/content_revisions/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'kysely'
import { safeParseOrThrow } from '../../utils/validate'
import { createPaginatedResponse } from '../../utils/response'
import { buildFilters } from '../../utils/filters'
import { contentRevisionQuerySchema } from '../../schemas/content-revision'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const q = getQuery(event)
    const parsed = safeParseOrThrow(contentRevisionQuerySchema, q)
    const {
      page,
      pageSize,
      search,
      entity_type,
      entity_id,
      version_number,
      status,
      language_code,
      content_version_id,
      created_by,
      sort,
      direction,
    } = parsed

    let base = globalThis.db
      .selectFrom('content_revisions as cr')
      .leftJoin('users as u', 'u.id', 'cr.created_by')
      .leftJoin('content_versions as cv', 'cv.id', 'cr.content_version_id')
      .select([
        'cr.id',
        'cr.entity_type',
        'cr.entity_id',
        'cr.version_number',
        'cr.status',
        'cr.language_code',
        'cr.content_version_id',
        'cr.created_by',
        'cr.created_at',
        'cr.notes',
        'cr.diff',
        'cr.prev_snapshot',
        'cr.next_snapshot',
        sql`coalesce(u.username, u.email)`.as('created_by_name'),
        sql`cv.version_semver`.as('content_version_semver'),
      ])

    if (entity_type) base = base.where('cr.entity_type', '=', entity_type)
    if (entity_id !== undefined) base = base.where('cr.entity_id', '=', entity_id)
    if (version_number !== undefined) base = base.where('cr.version_number', '=', version_number)
    if (status) base = base.where('cr.status', '=', status)
    if (language_code) base = base.where('cr.language_code', '=', language_code)
    if (content_version_id !== undefined) base = base.where('cr.content_version_id', '=', content_version_id)
    if (created_by !== undefined) base = base.where('cr.created_by', '=', created_by)

    const { query, totalItems, page: currentPage, pageSize: currentSize, resolvedSortField, resolvedSortDirection } =
      await buildFilters(base, {
        page,
        pageSize,
        search,
        status,
        applySearch: (qb, s) =>
          qb.where((eb) =>
            eb.or([
              eb('cr.notes', 'ilike', `%${s}%`),
              eb('cr.entity_type', 'ilike', `%${s}%`),
              eb('cr.status', 'ilike', `%${s}%`),
            ]),
          ),
        sort: { field: sort, direction },
        defaultSort: { field: 'created_at', direction: 'desc' },
        sortColumnMap: {
          created_at: 'cr.created_at',
          version_number: 'cr.version_number',
          status: 'cr.status',
        },
        countDistinct: 'cr.id',
      })

    const rows = await query.execute()

    globalThis.logger?.info('Content revisions listed', {
      page: currentPage,
      pageSize: currentSize,
      count: rows.length,
      sort: resolvedSortField ?? 'created_at',
      direction: resolvedSortDirection ?? 'desc',
      timeMs: Date.now() - startedAt,
    })

    return createPaginatedResponse(rows, totalItems, currentPage, currentSize, search ?? null)
  } catch (error) {
    globalThis.logger?.error('Failed to list content revisions', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
