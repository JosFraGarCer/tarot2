// server/api/users/me.get.ts
import { defineEventHandler, createError } from 'h3'
import { sql } from 'kysely'
import { createResponse } from '../../utils/response'
import { getUserFromEvent } from '../../plugins/auth'
import { mergePermissions } from '../../utils/users'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()

  try {
    // 🔹 Recuperar usuario autenticado desde el token/cookie
    const baseUser = await getUserFromEvent(event)
    if (!baseUser)
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

    // 🔹 Cargar usuario completo + roles
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
        sql`coalesce(json_agg(r.*) filter (where r.id is not null), '[]'::json)`.as('roles'),
      ])
      .where('u.id', '=', baseUser.id)
      .groupBy(['u.id'])
      .executeTakeFirst()

    if (!row)
      throw createError({ statusCode: 404, statusMessage: 'User not found' })

    // 🔹 Parsear roles y combinar permisos
    const rolesArr: any[] = (() => {
      const rolesVal = (row as any).roles
      if (Array.isArray(rolesVal)) return rolesVal
      try {
        return JSON.parse(rolesVal as string)
      } catch {
        return []
      }
    })()

    const permissions = mergePermissions(rolesArr)

    // 🔹 Logging con IP y tiempo
    const ip =
      (event.node.req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() || event.node.req.socket?.remoteAddress || null

    globalThis.logger?.info('User profile fetched', {
      userId: baseUser.id,
      ip,
      timeMs: Date.now() - startedAt,
    })

    // 🔹 Respuesta final
    return createResponse({
      ...row,
      roles: rolesArr,
      permissions,
    })
  } catch (error) {
    globalThis.logger?.error('Failed to fetch current user', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
