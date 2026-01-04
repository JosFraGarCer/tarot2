// server/middleware/01.auth.guard.ts
// /server/middleware/01.auth.guard.ts
import { defineEventHandler, createError } from 'h3'

const PUBLIC_API_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/logout',
])

export default defineEventHandler((event) => {
  const path = event.path || ''
  if (!path.startsWith('/api')) return
  if (event.node.req.method === 'OPTIONS') return

  // ✅ Solo login/logout son públicos
  if (PUBLIC_API_PATHS.has(path)) return

  const user = event.context.user as {
    status?: string
    permissions?: Record<string, boolean>
    roles?: { name?: string }[]
  } | undefined

  if (!user) throw createError({ statusCode: 401, message: 'Not authenticated' })
  if (user.status === 'suspended')
    throw createError({ statusCode: 403, message: 'Account suspended' })

  const perms = user.permissions || {}
  const role = user.roles?.[0]?.name?.toLowerCase?.() || ''

  // Admin acceso total
  if (role === 'admin' || perms.canManageUsers) return

  // Ejemplo granular: solo managers editan roles
  if (path.startsWith('/api/role') && !perms.canManageUsers)
    throw createError({ statusCode: 403, message: 'Permission required' })
})
