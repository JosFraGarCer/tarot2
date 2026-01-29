// server/middleware/00.auth.hydrate.ts
import { defineEventHandler } from 'h3'
import { verifyToken, type UserPayload } from '../plugins/auth'
import { mergePermissions } from '../utils/users'

/**
 * Robust Auth Hydration Middleware
 * 
 * Improvements:
 * 1. Fail-fast on corrupted permissions (prevents inconsistent state).
 * 2. Uses Nitro Storage for session caching (scalable, can use Redis/Valkey).
 * 3. Cleaned up error handling.
 */

export default defineEventHandler(async (event) => {
  try {
    const context = event.context as Record<string, unknown>
    const storage = useStorage('cache')
    const CACHE_PREFIX = 'auth:session:'
    const CACHE_TTL = 30 // seconds

    let token = event.node.req.headers.cookie
      ?.split(';')
      .find(c => c.trim().startsWith('auth_token='))
      ?.split('=')[1]

    if (!token) {
      const authHeader = event.node.req.headers.authorization
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      }
    }

    if (!token) return

    const userPayload = (await verifyToken(token)) as UserPayload | null
    if (!userPayload?.id) return

    const userId = Number(userPayload.id)
    
    // Check Nitro Cache instead of local Map
    const cached = await storage.getItem<any>(`${CACHE_PREFIX}${userId}`)
    if (cached) {
      context.user = cached
      return
    }

    // Fetch user data
    const user = await globalThis.db
      .selectFrom('users')
      .select([
        'id',
        'username',
        'email',
        'status',
        'image',
        'created_at',
        'modified_at',
      ])
      .where('id', '=', userId)
      .executeTakeFirst()

    if (!user || user.status === 'suspended') return

    // Fetch roles
    const roles = await globalThis.db
      .selectFrom('user_roles as ur')
      .innerJoin('roles as r', 'r.id', 'ur.role_id')
      .select(['r.id', 'r.name', 'r.permissions'])
      .where('ur.user_id', '=', user.id)
      .execute()

    const rolesArr = roles.map(r => {
      let permissions: Record<string, boolean> = {}
      const permissionsRaw: unknown = r.permissions
      try {
        if (typeof r.permissions === 'string') {
          permissions = JSON.parse(r.permissions) as Record<string, boolean>
        } else if (r.permissions) {
          permissions = r.permissions as Record<string, boolean>
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e)
        const logger = event.context.logger ?? (globalThis as any).logger
        logger?.error?.(
          { userId: user.id, roleId: r.id, permissionsRaw, error: errorMessage },
          'CRITICAL: Failed to parse role permissions. User session will not be hydrated to avoid inconsistent state.'
        )
        throw new Error(`Corrupted permissions for role ${r.id}`)
      }
      return {
        id: r.id,
        name: r.name,
        permissions,
      }
    })

    const permissions = mergePermissions(rolesArr)
    const userData = { ...user, roles: rolesArr, permissions }

    // Update Nitro Storage Cache
    await storage.setItem(`${CACHE_PREFIX}${userId}`, userData, { ttl: CACHE_TTL })
    
    context.user = userData
  } catch (err) {
    const logger = event.context.logger ?? (globalThis as any).logger
    logger?.error?.(
      { err: err instanceof Error ? err.message : String(err) },
      'Auth hydration failed',
    )
  }
})
