// /app/stores/user.ts
import { defineStore, acceptHMRUpdate } from 'pinia'
import type { MeResponse, UserDTO } from '@/types/api'

interface UserState {
  user: UserDTO | null
  token: string | null
  loading: boolean
  loggingOut: boolean
  initialized: boolean
  error: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    token: null,
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
    setToken(token: string | null) {
      this.token = token
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

        const payload = (res as any)?.data ?? (res as any)

        if (payload) {
          this.setUser(payload as UserDTO)
          return payload as UserDTO
        }

        this.logout()
        return null
      } catch (err: any) {
        this.logout()

        // 401 sin cookie es esperado en invitados → no lo tratamos como error fatal
        if (err?.status === 401 || err?.data?.statusCode === 401) {
          this.error = null
          return null
        }

        const message = err?.data?.message || err?.message || 'Session expired'
        this.error = message
        return null
      } finally {
        this.loading = false
      }
    },
    logout() {
      this.user = null
      this.token = null
      this.loading = false
      this.loggingOut = false
      this.initialized = true
      this.error = null
    },
    hasPermission(key: string): boolean {
      return !!this.permissions[key]
    },
  },

  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
