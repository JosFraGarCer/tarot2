import { defineEventHandler, createError } from 'h3'

const PUBLIC_API_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
])

export default defineEventHandler((event) => {
  const path = event.path || ''
  if (!path.startsWith('/api')) return
  
  // H3 native method check
  if (event.method === 'OPTIONS') return

  // ✅ Solo login/logout/session son públicos
  if (PUBLIC_API_PATHS.has(path)) return

  const user = event.context.user

  if (!user) {
    throw createError({ 
      statusCode: 401, 
      message: 'Not authenticated',
      data: { path }
    })
  }
  
  if (user.status === 'suspended') {
    throw createError({ 
      statusCode: 403, 
      message: 'Account suspended' 
    })
  }

  const perms = user.permissions || {}
  const roles = user.roles || []
  const isAdmin = roles.some((r: any) => r.name?.toLowerCase() === 'admin') || perms.canManageUsers

  // Admin acceso total
  if (isAdmin) return

  // Ejemplo granular: solo managers editan roles
  if (path.startsWith('/api/role') && !perms.canManageUsers) {
    throw createError({ 
      statusCode: 403, 
      message: 'Permission required' 
    })
  }
})
