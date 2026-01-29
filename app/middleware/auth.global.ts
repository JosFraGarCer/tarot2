// app/middleware/auth.global.ts
import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useUserStore } from '~/stores/user'
import { useAuthRoles } from '~/composables/auth/useAuthRoles'
import { authConfig, isPublicRoute, canAccessPath } from '~/config/auth.config'

/**
 * Middleware global de autenticación y control de acceso
 * - Protege rutas privadas
 * - Redirige según rol o permisos
 * - Configuración centralizada en auth.config.ts
 */
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
  const isPublic = isPublicRoute(to.path)

  // 1️⃣ Invitado → solo público
  if (!user && !isPublic) {
    return navigateTo(authConfig.redirectAfterLogout)
  }

  // 2️⃣ Logueado → no puede volver a login
  if (user && to.path === '/login') {
    return navigateTo(authConfig.redirectAfterLogin)
  }

  // 3️⃣ Determinar rol y permisos usando composable
  const { isAdmin, isStaff, isUser } = useAuthRoles()

  // 4️⃣ Admin tiene acceso a todo directamente
  if (isAdmin.value) {
    return
  }

  // 5️⃣ Verificar acceso para staff y users
  if (!canAccessPath(to.path, isAdmin.value, isStaff.value, isUser.value)) {
    if (isStaff.value && to.path.startsWith('/admin')) {
      return navigateTo(authConfig.adminRedirect)
    }
    if (isUser.value && !to.path.startsWith('/user')) {
      return navigateTo(authConfig.redirectAfterLogin)
    }
  }
})
