// app/middleware/auth.global.ts
import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useUserStore } from '~/stores/user'

/**
 * Middleware global de autenticación y control de acceso
 * - Protege rutas privadas
 * - Redirige según rol o permisos
 */
const PUBLIC_ROUTES = ['/', '/login']

export default defineNuxtRouteMiddleware(async (to) => {
  const store = useUserStore()

  // 🧩 Hidratar usuario si no está inicializado
  if (!store.initialized) {
    try {
      await store.fetchCurrentUser()
    } catch (err) {
      console.warn('[auth.global] fetchCurrentUser failed:', err)
    }
  }

  const user = store.user
  const isPublic = PUBLIC_ROUTES.includes(to.path)

  // 1️⃣ Invitado → solo público
  if (!user && !isPublic) {
    return navigateTo('/login')
  }

  // 2️⃣ Logueado → no puede volver a login
  if (user && to.path === '/login') {
    return navigateTo('/user')
  }

  // 3️⃣ Determinar rol y permisos
  const role = user?.roles?.[0]?.name?.toLowerCase?.() || ''
  const perms = user?.permissions || {}

  const isAdmin =
    role === 'admin' ||
    perms.canManageUsers ||
    perms.canAccessAdmin

  const isStaff =
    role === 'staff' ||
    perms.canEditContent ||
    perms.canReview ||
    perms.canTranslate

  // 4️⃣ Reglas de acceso
  if (isAdmin) {
    // ✅ Admin o manager puede ir a cualquier lado
    return
  }

  if (isStaff) {
    // 👷 Staff puede acceder a /manage o /user
    if (to.path.startsWith('/admin')) return navigateTo('/manage')
    return
  }

  // 👤 Usuario normal: solo /user
  if (user && !to.path.startsWith('/user')) {
    return navigateTo('/user')
  }
})
