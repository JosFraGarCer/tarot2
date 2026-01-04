// server/api/role/index.get.ts
// server/api/roles/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
// sql import removed - not currently used
import { safeParseOrThrow } from '../../utils/validate'
import { createPaginatedResponse } from '../../utils/response'
import { buildFilters } from '../../utils/filters'
import { roleQuerySchema } from '../../schemas/role'

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
        search: (search ?? search2),
        // search over name and description
        searchColumns: ['r.name', 'r.description'],
        countDistinct: 'r.id',
        sort: { field: ((q as Record<string, unknown>).sort as string) ?? 'created_at', direction: ((q as Record<string, unknown>).direction as 'asc' | 'desc') ?? 'desc' },
        defaultSort: { field: 'created_at', direction: 'desc' },
        sortColumnMap: {
          name: 'r.name',
          created_at: 'r.created_at',
        },
      },
    )

    const rows = await query.execute()

    const data = rows.map((r: unknown) => {
      const row = r as {
        id: number
        name: string
        description: string | null
        permissions: unknown
        created_at: Date | string
      }
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        permissions: (() => {
          const val = row.permissions
          if (val && typeof val === 'string') {
            try { return JSON.parse(val) } catch { return {} }
          }
          return val ?? {}
        })(),
        created_at: row.created_at,
      }
    })

    globalThis.logger?.info('Roles listed', {
      page: p,
      pageSize: ps,
      count: data.length,
      search: (search ?? search2) ?? null,
      sort: resolvedSortField ?? 'created_at',
      direction: resolvedSortDirection ?? 'desc',
      timeMs: Date.now() - startedAt,
    })

    return createPaginatedResponse(data, totalItems, p, ps, (search ?? search2) ?? null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch roles', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
