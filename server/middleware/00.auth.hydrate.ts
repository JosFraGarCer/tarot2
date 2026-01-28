// server/middleware/00.auth.hydrate.ts
import { defineEventHandler } from 'h3'
import { verifyToken, type UserPayload } from '../plugins/auth'
import { mergePermissions } from '../utils/users'

// Simple in-memory cache for auth sessions to reduce DB load
interface CachedUser {
  data: {
    id: number
    username: string
    email: string
    status: string
    image: string | null
    created_at: Date
    modified_at: Date
    roles: Array<{ id: number; name: string; permissions: Record<string, boolean> }>
    permissions: Record<string, boolean>
  }
  expiresAt: number
}
const authCache = new Map<number, CachedUser>()
const CACHE_TTL = 30000 // 30 seconds

export default defineEventHandler(async (event) => {
  try {
    const context = event.context as Record<string, unknown>
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
    const now = Date.now()
    const cached = authCache.get(userId)
    if (cached && cached.expiresAt > now) {
      context.user = cached.data
      return
    }

    // Fetch user data without heavy JOIN and json_agg
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

    // Fetch roles separately - only when needed
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
        // Log invalid permissions but don't fail the request
        const logger = event.context.logger ?? (globalThis as any).logger
        logger?.warn?.(
          { userId: user.id, roleId: r.id, permissionsRaw },
          'Failed to parse role permissions, using empty set',
        )
      }
      return {
        id: r.id,
        name: r.name,
        permissions,
      }
    })

    const permissions = mergePermissions(rolesArr)
    const userData = { ...user, roles: rolesArr, permissions }

    // Update cache
    authCache.set(user.id, { data: userData, expiresAt: now + CACHE_TTL })
    
    context.user = userData
  } catch (err) {
    const logger = event.context.logger ?? (globalThis as any).logger
    logger?.error?.(
      { err: err instanceof Error ? err.message : String(err), userId },
      'Auth hydration failed',
    )
  }
})
