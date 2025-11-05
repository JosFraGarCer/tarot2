// server/api/users/me.get.ts
import { defineEventHandler, createError } from 'h3'
import { sql } from 'kysely'
import { createResponse } from '../../utils/response'
import { mergePermissions } from '../../utils/users'
import { getUserFromEvent } from '../../plugins/auth'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()

  try {
    // 🔐 Verificamos el token y obtenemos el usuario básico (id, email, username)
    const authUser = await getUserFromEvent(event)
    if (!authUser?.id) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // 📦 Obtenemos el usuario completo con roles
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
      .where('u.id', '=', authUser.id)
      .groupBy('u.id')
      .executeTakeFirst()

    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    // 🧩 Parseamos roles y combinamos permisos
    const rolesArr: any[] = Array.isArray((row as any).roles)
      ? (row as any).roles
      : (() => {
          try {
            return JSON.parse((row as any).roles as string)
          } catch {
            return []
          }
        })()

    const permissions = mergePermissions(rolesArr)

    // 🧾 Logging detallado
    const ip =
      (event.node.req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      event.node.req.socket?.remoteAddress ||
      null

    globalThis.logger?.info('User profile fetched', {
      userId: authUser.id,
      email: authUser.email,
      ip,
      timeMs: Date.now() - startedAt,
    })

    // ✅ Respuesta coherente con el resto de la API
    return createResponse({
      ...(row as any),
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
