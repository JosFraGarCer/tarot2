// server/api/content_versions/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'kysely'
import { safeParseOrThrow } from '../../utils/validate'
import { buildFilters } from '../../utils/filters'
import { createPaginatedResponse } from '../../utils/response'
import { contentVersionQuerySchema } from '@shared/schemas/content-version'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const q = getQuery(event)
    const parsed = safeParseOrThrow(contentVersionQuerySchema, q)
    const { page, pageSize, search, version_semver, created_by, release, sort, direction } = parsed

    let base = globalThis.db
      .selectFrom('content_versions as cv')
      .leftJoin('users as u', 'u.id', 'cv.created_by')
      .select([
        'cv.id',
        'cv.version_semver',
        'cv.description',
        'cv.metadata',
        'cv.created_by',
        'cv.created_at',
        'cv.release',
        sql`coalesce(u.username, u.email)`.as('created_by_name'),
      ])

    if (version_semver) base = base.where('cv.version_semver', '=', version_semver)
    if (created_by !== undefined) base = base.where('cv.created_by', '=', created_by)
    if (release) base = base.where('cv.release', '=', release)

    const { query, totalItems, page: currentPage, pageSize: currentSize, resolvedSortField, resolvedSortDirection } =
      await buildFilters(base, {
        page,
        pageSize,
        search,
        applySearch: (qb, s) =>
          qb.where((eb) =>
            eb.or([
              eb('cv.version_semver', 'ilike', `%${s}%`),
              eb('cv.description', 'ilike', `%${s}%`),
            ]),
          ),
        sort: { field: sort, direction },
        defaultSort: { field: 'created_at', direction: 'desc' },
        sortColumnMap: {
          created_at: 'cv.created_at',
          version_semver: 'cv.version_semver',
        },
        countDistinct: 'cv.id',
      })

    const rows = await query.execute()

    globalThis.logger?.info('Content versions listed', {
      page: currentPage,
      pageSize: currentSize,
      count: rows.length,
      sort: resolvedSortField ?? 'created_at',
      direction: resolvedSortDirection ?? 'desc',
      timeMs: Date.now() - startedAt,
    })

    return createPaginatedResponse(rows, totalItems, currentPage, currentSize, search ?? null)
  } catch (error) {
    globalThis.logger?.error('Failed to list content versions', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
