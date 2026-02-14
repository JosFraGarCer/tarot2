// app/composables/auth/useAuth.ts
// /app/composables/auth/useAuth.ts
import { computed } from 'vue'
import { useUserStore } from '~/stores/user'
import type { LoginResponse, MeResponse, UserDTO } from '@/types/api'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const errObj = error as { message?: unknown; data?: { message?: unknown } }
    if (typeof errObj.data?.message === 'string' && errObj.data.message.length > 0) {
      return errObj.data.message
    }
    if (typeof errObj.message === 'string' && errObj.message.length > 0) {
      return errObj.message
    }
  }
  return fallback
}

export function useAuth() {
  const store = useUserStore()

  /** 🔐 Login user (by email or username) */
  async function login(identifier: string, password: string): Promise<UserDTO> {
    store.setLoading(true)
    store.setError(null)

    try {
      const res = await $fetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: { identifier, password },
        credentials: 'include',
      })

      const { user } = res.data
      if (!user) throw new Error('Invalid login response')

      store.setUser(user)

      return user
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Login failed. Please check your credentials.')
      store.setError(msg)
      throw err
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
      // Backend clears the auth_token cookie
      store.logout()
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Logout failed')
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
      store.setError(extractErrorMessage(err, 'Session expired'))
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
