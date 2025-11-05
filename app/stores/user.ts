// /app/stores/user.ts
import { defineStore, acceptHMRUpdate } from 'pinia'

interface User {
  id: number
  username: string
  email: string
  image?: string | null
  roles?: Array<{ id: number; name: string }>
  permissions?: Record<string, boolean>
}

interface UserState {
  user: User | null
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
    isAuthenticated: (state) => !!state.user,
    permissions: (state) => state.user?.permissions ?? {},
  },

  actions: {
    /** ✅ Set user object */
    setUser(user: User | null) {
      this.user = user
      this.initialized = true
      this.error = null
    },

    /** ✅ Set token value */
    setToken(token: string | null) {
      this.token = token
    },

    /** ⚡ Mark loading/pending state */
    setLoading(value: boolean) {
      this.loading = value
    },

    /** ⚡ Mark logout in progress */
    setLoggingOut(value: boolean) {
      this.loggingOut = value
    },

    /** 🧹 Reset everything (on logout or error) */
    logout() {
      this.user = null
      this.token = null
      this.loading = false
      this.loggingOut = false
      this.initialized = true
      this.error = null
    },

    /** ❌ Handle errors */
    setError(message: string | null) {
      this.error = message
    },

    /** 🔐 Permission helper */
    hasPermission(key: string) {
      return !!this.permissions[key]
    },
  },

  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
