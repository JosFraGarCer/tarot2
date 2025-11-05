// /app/composables/auth/useAuth.ts
import { computed } from 'vue'
import { useUserStore } from '~/stores/user'

export function useAuth() {
  const store = useUserStore()

  /** 🔐 Login user (by email or username) */
  async function login(identifier: string, password: string) {
    store.setLoading(true)
    store.setError(null)

    try {
      const { data, error } = await useFetch('/api/auth/login', {
        method: 'POST',
        body: { identifier, password },
        credentials: 'include',
      })

      if (error.value) throw error.value
      if (!data.value) throw new Error('No data returned from login')

      // Standard API envelope { success, data, meta }
      const payload: any = (data.value as any).data ?? data.value
      if (!payload?.user) throw new Error('Invalid login response shape')

      store.setUser(payload.user)
      store.setToken(payload.token ?? null)
      return payload.user
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        'Login failed. Please check your credentials.'
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
      store.logout()
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Logout failed'
      store.setError(msg)
      throw err
    } finally {
      store.setLoggingOut(false)
    }
  }

  /** 👤 Fetch current user (hydrate from session cookie) */
  async function fetchCurrentUser() {
    store.setLoading(true)
    store.setError(null)
    try {
      const data = await $fetch('/api/users/me', { credentials: 'include' })
      const payload: any = (data as any).data ?? data
      if (payload) store.setUser(payload)
    } catch (err: any) {
      store.logout()
      store.setError(err?.data?.message || err?.message || 'Session expired')
    } finally {
      store.setLoading(false)
    }
  }

  const user = computed(() => store.user)
  const isAuthenticated = computed(() => store.isAuthenticated)
  const error = computed(() => store.error)

  return {
    login,
    logout,
    fetchCurrentUser,
    user,
    isAuthenticated,
    error,
    loading: computed(() => store.loading),
    loggingOut: computed(() => store.loggingOut),
    hasPermission: store.hasPermission,
  }
}
