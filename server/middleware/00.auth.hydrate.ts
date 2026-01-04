// server/middleware/00.auth.hydrate.ts
// /server/middleware/00.auth.hydrate.ts
import { defineEventHandler } from 'h3'
import { sql } from 'kysely'
import { verifyToken } from '../plugins/auth'
import { mergePermissions } from '../utils/users'

export default defineEventHandler(async (event) => {
  try {
    const token = event.node.req.headers.cookie
      ?.split(';')
      .find(c => c.trim().startsWith('auth_token='))
      ?.split('=')[1]

    if (!token) return

    const userPayload = await verifyToken(token)
    if (!userPayload?.id) return

    const user = await globalThis.db
      .selectFrom('users as u')
      .leftJoin('user_roles as ur', 'ur.user_id', 'u.id')
      .leftJoin('roles as r', 'r.id', 'ur.role_id')
      .select([
        'u.id',
        'u.username',
        'u.email',
        'u.status',
        'u.image',
        'u.created_at',
        'u.modified_at',
        sql`coalesce(json_agg(r.*) filter (where r.id is not null), '[]'::json)`.as('roles')
      ])
      .where('u.id', '=', userPayload.id)
      .groupBy('u.id')
      .executeTakeFirst()

    if (!user || user.status === 'suspended') return

    const userRow = user as {
      id: number
      username: string
      email: string
      status: string
      image: string | null
      created_at: Date | string
      modified_at: Date | string
      roles: unknown
    }

    const rolesArr = (() => {
      const val = userRow.roles
      if (Array.isArray(val)) return val as Record<string, unknown>[]
      try { return JSON.parse(val as string) } catch { return [] }
    })()

    const permissions = mergePermissions(rolesArr as { permissions?: unknown }[])

    event.context.user = { ...userRow, roles: rolesArr, permissions }
  } catch (err) {
    console.warn('[auth.hydrate] Failed to decode user:', err)
  }
})
