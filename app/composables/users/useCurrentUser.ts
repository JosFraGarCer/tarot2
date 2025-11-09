// app/composables/users/useCurrentUser.ts
import { computed, watch } from 'vue'
import { useAsyncData, useNuxtApp } from '#imports'
import { useUserStore } from '~/stores/user'
import type { UserDTO } from '@/types/api'

interface UseCurrentUserOptions {
  /**
   * Whether to trigger the initial fetch on the server. Defaults to true so SSR pages hydrate properly.
   */
  server?: boolean
}

export function useCurrentUser(options: UseCurrentUserOptions = {}) {
  const store = useUserStore()
  const nuxtApp = useNuxtApp()

  const shouldFetch = computed(() => !store.initialized && !store.loading)

  const { pending, error, refresh } = useAsyncData<UserDTO | null>(
    'current-user',
    async () => {
      if (!shouldFetch.value) return store.user
      return await store.fetchCurrentUser()
    },
    {
      immediate: shouldFetch.value,
      server: options.server ?? true,
      getCachedData(key) {
        // Allow store state to satisfy hydration without extra fetch
        if (store.user) return store.user
        return nuxtApp.payload.data[key] as UserDTO | null | undefined
      },
    },
  )

  // Keep async error state in sync with store error so callers can react
  watch(error, (value) => {
    if (value) store.setError(value instanceof Error ? value.message : String(value))
  })

  async function ensureCurrentUser() {
    if (store.user) return store.user
    await store.fetchCurrentUser()
    return store.user
  }

  return {
    currentUser: computed(() => store.user),
    isAuthenticated: computed(() => store.isAuthenticated),
    loading: computed(() => store.loading || pending.value),
    error: computed(() => store.error),
    refresh: async () => {
      await store.fetchCurrentUser()
      await refresh()
    },
    ensureCurrentUser,
  }
}
