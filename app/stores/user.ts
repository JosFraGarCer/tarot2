// /app/stores/user.ts
import { defineStore, acceptHMRUpdate } from 'pinia'
import type { UserDTO } from '@/types/api'

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
