// server/api/user/index.get.ts
// server/api/users/index.get.ts
import { defineEventHandler, getValidatedQuery } from 'h3'
import { sql } from 'kysely'
import { createPaginatedResponse } from '../../utils/response'
import { buildFilters } from '../../utils/filters'
import { mergePermissions } from '../../utils/users'
import { userQuerySchema } from '../../schemas/user'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const parsedQuery = await getValidatedQuery(
      event,
      userQuerySchema.parse,
    )
    const { page, pageSize, q: search, search: search2, status, is_active, role_id } = parsedQuery

    let base = globalThis.db
      .selectFrom('users as u')
      .leftJoin('user_roles as ur', 'ur.user_id', 'u.id')
      .leftJoin('roles as r', 'r.id', 'ur.role_id')
      .select([
        'u.id',
        'u.username',
        'u.email',
        'u.image',
        'u.status',
        'u.created_at',
        'u.modified_at',
        sql`coalesce(json_agg(r.*) filter (where r.id is not null), '[]'::json)`.
          as('roles'),
      ])
      .groupBy(['u.id'])

    // Filters
    if (status) base = base.where('u.status', '=', status)
    if (is_active !== undefined) {
      if (is_active) base = base.where('u.status', '=', sql`'active'`)
      else base = base.where('u.status', '!=', sql`'active'`)
    }
    if (role_id !== undefined) base = base.where('ur.role_id', '=', role_id)

    const { query, totalItems, page: p, pageSize: ps, resolvedSortField, resolvedSortDirection } = await buildFilters(
      base,
      {
        page,
        pageSize,
        search: (search ?? search2),
        status, // no-op for users, but keeps signature consistent
        applySearch: (qb, s) =>
          qb.where((eb) => eb.or([sql`u.username ilike ${'%' + s + '%'}`, sql`u.email ilike ${'%' + s + '%'}`])),
        countDistinct: 'u.id',
        sort: { field: (parsedQuery.sort as string) ?? 'created_at', direction: (parsedQuery.direction as 'asc' | 'desc') ?? 'desc' },
        defaultSort: { field: 'created_at', direction: 'desc' },
        sortColumnMap: {
          username: 'u.username',
          email: 'u.email',
          created_at: 'u.created_at',
          modified_at: 'u.modified_at',
          status: 'u.status',
          is_active: sql`case when u.status = 'active' then 1 else 0 end`,
        },
      },
    )

    const rows = await query.execute()

    const data = rows.map((u: unknown) => {
      const user = u as {
        id: number
        username: string
        email: string
        image: string | null
        status: string
        created_at: Date | string
        modified_at: Date | string
        roles: unknown
      }
      const rolesArr: Record<string, unknown>[] = Array.isArray(user.roles)
        ? user.roles as Record<string, unknown>[]
        : (() => {
            try { return JSON.parse(user.roles as string) } catch { return [] }
          })()
      const permissions = mergePermissions(rolesArr as { permissions?: unknown }[])
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        image: user.image,
        status: user.status,
        created_at: user.created_at,
        modified_at: user.modified_at,
        roles: rolesArr,
        permissions,
      }
    })

    globalThis.logger?.info('Users listed', {
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
    globalThis.logger?.error('Failed to fetch users', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
