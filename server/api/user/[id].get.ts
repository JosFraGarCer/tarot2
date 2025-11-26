// server/api/user/[id].get.ts
// server/api/users/[id].get.ts
import { defineEventHandler } from 'h3'
import { sql } from 'kysely'
import { notFound } from '../../utils/error'
import { createResponse } from '../../utils/response'
import { mergePermissions } from '../../utils/users'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const id = event.context.params?.id as string

    const row = await globalThis.db
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
        sql`coalesce(json_agg(r.*) filter (where r.id is not null), '[]'::json)`.as('roles'),
      ])
      .where('u.id', '=', id)
      .groupBy('u.id')
      .executeTakeFirst()

    if (!row) notFound('User not found')

    const rolesArr: any[] = Array.isArray((row as any).roles)
      ? ((row as any).roles as any[])
      : (() => {
          try {
            return JSON.parse((row as any).roles as string)
          } catch {
            return []
          }
        })()
    const permissions = mergePermissions(rolesArr)

    const user = { ...(row as any), roles: rolesArr, permissions }

    globalThis.logger?.info('User fetched', { id, timeMs: Date.now() - startedAt })
    return createResponse(user, null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch user', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
