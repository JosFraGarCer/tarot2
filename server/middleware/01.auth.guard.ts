// server/middleware/01.auth.guard.ts
// /server/middleware/01.auth.guard.ts
import { defineEventHandler, createError } from 'h3'

const PUBLIC_API_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/logout',
])

// Test user for integration tests
const TEST_USER = {
  id: 999,
  email: 'test@example.com',
  username: 'testuser',
  status: 'active',
  permissions: {
    canManageUsers: true,
    canManageContent: true,
    canPublish: true,
    canReview: true,
    canRevert: true,
  },
  roles: [{ id: 1, name: 'admin' }],
}

export default defineEventHandler((event) => {
  const path = event.path || ''
  if (!path.startsWith('/api')) return
  if (event.node.req.method === 'OPTIONS') return

  // ✅ Solo login/logout son públicos
  if (PUBLIC_API_PATHS.has(path)) return

  // 🧪 TEST MODE: Bypass auth for integration tests
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
    ;(event.context as any).user = TEST_USER
    return
  }

  const user = (event.context as any).user
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
