import { defineEventHandler, getRequestIP, getCookie } from 'h3'
import { sql } from 'kysely'
import { verifyToken } from '../plugins/auth'
import { mergePermissions } from '../utils/users'
import { normalizeError } from '../../shared/utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const token = getCookie(event, 'auth_token')

    if (!token) return

    const userPayload = await verifyToken(token)
    const userId = Number(userPayload?.id)
    if (!userId || isNaN(userId)) return

    // OPTIMIZACIÓN: Query ligera solo para validar estado activo
    const user = await globalThis.db
      .selectFrom('users')
      .select(['id', 'username', 'email', 'image', 'status'])
      .where('id', '=', userId)
      .executeTakeFirst()

    if (!user || user.status !== 'active') {
      return
    }

    // Roles y Permisos (Lazy load o Caché en contexto si fuera necesario)
    const rolesRow = await globalThis.db
      .selectFrom('user_roles as ur')
      .leftJoin('roles as r', 'r.id', 'ur.role_id')
      .select(
        sql`coalesce(json_agg(r.*), '[]'::json)`.as('roles')
      )
      .where('ur.user_id', '=', user.id)
      .executeTakeFirst()

    const rolesArr = (rolesRow as any)?.roles || []
    const permissions = mergePermissions(rolesArr)

    // Inyectar en el contexto de h3 (Nitro) siguiendo estándar Nuxt 5
    event.context.user = {
      ...user,
      roles: rolesArr,
      permissions
    }
    
    event.context.auth = {
      authenticated: true,
      userId: user.id,
      ip: getRequestIP(event)
    }
  } catch (err) {
    // Usar normalizador compartido
    const error = normalizeError(err)
    console.warn('[auth.hydrate] Failed to decode user:', error.error.message)
  }
})
