// app/composables/useUser.ts
// /app/composables/useUser.ts
import { ref, computed } from 'vue'
import { useUserStore } from '~/stores/user'
import type { MeResponse } from '@/types/api'

export function useUser() {
  const store = useUserStore()
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const user = computed(() => store.user)
  const isAuthenticated = computed(() => store.isAuthenticated)
  const hasPermission = (key: string) => store.hasPermission(key)

  async function fetchCurrentUser() {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<MeResponse>('/api/user/me', {
        credentials: 'include',
      })
      if (res?.data) store.setUser(res.data)
      else store.logout()
    } catch (err: any) {
      error.value = err
      store.logout()
    } finally {
      loading.value = false
    }
  }

  async function updateCurrentUser(updates: Record<string, any>) {
    if (!store.user?.id) throw new Error('User not loaded')

    loading.value = true
    error.value = null

    try {
      const res = await $fetch(`/api/user/${store.user.id}`, {
        method: 'PATCH',
        body: updates,
        credentials: 'include',
      })
      const payload: any = (res as any).data ?? res
      store.setUser(payload)
      return payload
    } catch (err: any) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    isAuthenticated,
    hasPermission,
    fetchCurrentUser,
    updateCurrentUser,
    loading,
    error,
  }
}
