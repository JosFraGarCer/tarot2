// app/composables/auth/useAuth.ts
import { computed } from 'vue'
import { useState, useId } from '#imports'
import { useUserStore } from '~/stores/user'
import type { LoginResponse, UserDTO } from '../../../shared/types/api'
import { normalizeError } from '../../../shared/utils/errors'

export function useAuth() {
  const store = useUserStore()
  
  // Estado compartido determinista para Nuxt 5
  // Evita Hydration Mismatch sincronizando el estado del usuario entre SSR y Cliente
  const authId = useId()
  const sharedUser = useState<UserDTO | null>(`auth-user-${authId}`, () => null)

  /** 🔐 Login user (by email or username) */
  async function login(identifier: string, password: string): Promise<UserDTO> {
    store.setLoading(true)
    store.setError(null)

    try {
      const res = await $fetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: { identifier, password },
      })

      const { user } = res.data
      if (!user) throw new Error('Invalid login response')

      store.setUser(user)
      sharedUser.value = user

      return user
    } catch (err: unknown) {
      const error = normalizeError(err)
      store.setError(error.error.message)
      throw err
    } finally {
      store.setLoading(false)
    }
  }

  /** 👤 Fetch current user session (Nuxt 5 Hydration optimized) */
  async function fetchCurrentUser(): Promise<void> {
    // Si ya tenemos el usuario en el estado compartido (hidratado del servidor), no re-fetch
    if (sharedUser.value) {
      store.setUser(sharedUser.value)
      return
    }

    store.setLoading(true)
    store.setError(null)
    try {
      const res = await $fetch<{ user: UserDTO }>('/api/auth/session')

      if (res?.user) {
        store.setUser(res.user)
        sharedUser.value = res.user
      } else {
        store.logout()
        sharedUser.value = null
      }
    } catch (err: unknown) {
      store.logout()
      sharedUser.value = null
      const error = normalizeError(err)
      store.setError(error.error.message)
    } finally {
      store.setLoading(false)
    }
  }

  /** 🚪 Logout user */
  async function logout() {
    store.setLoggingOut(true)
    store.setError(null)
    try {
      await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      // ⚠️ el backend aún no limpia cookie (ver SECURITY.md)
      store.logout()
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Logout failed')
      store.setError(msg)
      throw err
    } finally {
      store.setLoggingOut(false)
    }
  }

  /** 👤 Fetch current user (hydrate from cookie/JWT) */
  async function fetchCurrentUser(): Promise<void> {
    store.setLoading(true)
    store.setError(null)
    try {
      const res = await $fetch<MeResponse>('/api/user/me', { credentials: 'include' })

      if (res?.data) {
        store.setUser(res.data)
      } else {
        store.logout()
      }
    } catch (err: unknown) {
      store.logout()
      store.setError(getErrorMessage(err, 'Session expired'))
    } finally {
      store.setLoading(false)
    }
  }

  return {
    login,
    logout,
    fetchCurrentUser,
    user: computed(() => store.user),
    isAuthenticated: computed(() => store.isAuthenticated),
    error: computed(() => store.error),
    loading: computed(() => store.loading),
    loggingOut: computed(() => store.loggingOut),
    hasPermission: store.hasPermission,
  }
}
