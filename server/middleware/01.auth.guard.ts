import { defineEventHandler, createError } from 'h3'

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/session',
]

export default defineEventHandler((event) => {
  const path = (event.path || '').split('?')[0].toLowerCase()
  if (!path.startsWith('/api')) return
  
  // H3 native method check
  if (event.method === 'OPTIONS') return

  // ✅ Solo login/logout/session son públicos (case-insensitive y prefijo base)
  if (PUBLIC_API_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))) return

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

  // ✅ Admin tiene acceso total
  if (isAdmin) return

  // 🔐 Validación de propiedad (Ownership) y permisos granulares (Senior Critic: "Security by Optimism")
  // Evita IDOR (Insecure Direct Object Reference) en la API de usuarios
  if (path.startsWith('/api/user/')) {
    const targetId = path.split('/')[3]
    if (targetId && targetId !== String(user.id)) {
      throw createError({ 
        statusCode: 403, 
        message: 'Forbidden: You can only access your own profile' 
      })
    }
  }

  // Ejemplo granular: solo managers editan roles
  if (path.startsWith('/api/role') && !perms.canManageUsers) {
    throw createError({ 
      statusCode: 403, 
      message: 'Permission required' 
    })
  }
})
