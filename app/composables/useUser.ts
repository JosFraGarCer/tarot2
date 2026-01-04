// app/composables/useUser.ts
import { ref, computed } from 'vue'
import { useUserStore } from '~/stores/user'
import type { MeResponse, UserDTO, ApiEnvelope } from '@/types/api'

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
    } catch (err: unknown) {
      error.value = err instanceof Error ? err : new Error(String(err))
      store.logout()
    } finally {
      loading.value = false
    }
  }

  async function updateCurrentUser(updates: Partial<UserDTO>) {
    if (!store.user?.id) throw new Error('User not loaded')

    loading.value = true
    error.value = null

    try {
      const res = await $fetch<ApiEnvelope<UserDTO>>(`/api/user/${store.user.id}`, {
        method: 'PATCH',
        body: updates,
        credentials: 'include',
      })
      const payload = res.data ?? (res as unknown as UserDTO)
      store.setUser(payload)
      return payload
    } catch (err: unknown) {
      error.value = err instanceof Error ? err : new Error(String(err))
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
