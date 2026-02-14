// app/stores/user.ts
// /app/stores/user.ts
import { defineStore, acceptHMRUpdate } from 'pinia'
import type { MeResponse, UserDTO } from '@/types/api'

function extractErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null
  const errObj = error as { status?: unknown; data?: { statusCode?: unknown } }
  if (typeof errObj.status === 'number') return errObj.status
  if (typeof errObj.data?.statusCode === 'number') return errObj.data.statusCode
  return null
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback
  const errObj = error as { message?: unknown; data?: { message?: unknown } }
  if (typeof errObj.data?.message === 'string' && errObj.data.message.length > 0) return errObj.data.message
  if (typeof errObj.message === 'string' && errObj.message.length > 0) return errObj.message
  return fallback
}

interface UserState {
  user: UserDTO | null
  loading: boolean
  loggingOut: boolean
  initialized: boolean
  error: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    loading: false,
    loggingOut: false,
    initialized: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.user,
    permissions: (state) => state.user?.permissions ?? {},
  },

  actions: {
    setUser(user: UserDTO | null) {
      this.user = user
      this.initialized = true
      this.error = null
    },
    setLoading(value: boolean) {
      this.loading = value
    },
    setLoggingOut(value: boolean) {
      this.loggingOut = value
    },
    setError(message: string | null) {
      this.error = message
    },
    async fetchCurrentUser() {
      if (this.loading) return null

      this.loading = true
      this.error = null

      try {
        const res = await $fetch<MeResponse>('/api/user/me', {
          credentials: 'include',
        })

        const payload = res?.data ?? null

        if (payload) {
          this.setUser(payload)
          return payload
        }

        this.logout()
        return null
      } catch (err: unknown) {
        this.logout()

        // 401 sin cookie es esperado en invitados → no lo tratamos como error fatal
        if (extractErrorStatus(err) === 401) {
          this.error = null
          return null
        }

        const message = extractErrorMessage(err, 'Session expired')
        this.error = message
        return null
      } finally {
        this.loading = false
      }
    },
    logout() {
      this.user = null
      this.loading = false
      this.loggingOut = false
      this.initialized = true
      this.error = null
    },
    hasPermission(key: string): boolean {
      return !!this.permissions[key]
    },
  },

  persist: {
    paths: ['user', 'initialized'],
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
