// server/api/role/index.get.ts
// server/api/roles/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { sql } from 'kysely'
import { safeParseOrThrow } from '../../utils/validate'
import { createPaginatedResponse } from '../../utils/response'
import { buildFilters } from '../../utils/filters'
import { roleQuerySchema } from '@shared/schemas/role'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const q = getQuery(event)
    const { page, pageSize, q: search, search: search2 } = safeParseOrThrow(roleQuerySchema, q)

    const base = globalThis.db
      .selectFrom('roles as r')
      .select([
        'r.id',
        'r.name',
        'r.description',
        'r.permissions',
        'r.created_at',
      ])

    const { query, totalItems, page: p, pageSize: ps, resolvedSortField, resolvedSortDirection } = await buildFilters(
      base,
      {
        page,
        pageSize,
        search: (q as any).search ?? search ?? search2,
        // search over name and description
        searchColumns: ['r.name', 'r.description'],
        countDistinct: 'r.id',
        sort: { field: (q as any).sort ?? 'created_at', direction: (q as any).direction ?? 'desc' },
        defaultSort: { field: 'created_at', direction: 'desc' },
        sortColumnMap: {
          name: 'r.name',
          created_at: 'r.created_at',
        },
      },
    )

    const rows = await query.execute()

    const data = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: (() => {
        const val = r.permissions as any
        if (val && typeof val === 'string') {
          try { return JSON.parse(val) } catch { return {} }
        }
        return val ?? {}
      })(),
      created_at: r.created_at,
    }))

    globalThis.logger?.info('Roles listed', {
      page: p,
      pageSize: ps,
      count: data.length,
      search: ((q as any).search ?? search ?? search2) ?? null,
      sort: resolvedSortField ?? 'created_at',
      direction: resolvedSortDirection ?? 'desc',
      timeMs: Date.now() - startedAt,
    })

    return createPaginatedResponse(data, totalItems, p, ps, ((q as any).search ?? search ?? search2) ?? null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch roles', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
