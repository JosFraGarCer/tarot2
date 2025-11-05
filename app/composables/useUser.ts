// /app/composables/useUser.ts
import { ref, computed } from 'vue'
import { useUserStore } from '~/stores/user'

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
      const { data, error: fetchError } = await useFetch('/api/users/me', {
        credentials: 'include',
      })
      if (fetchError.value) throw fetchError.value
      const payload: any = (data.value as any)?.data ?? data.value
      if (payload) store.setUser(payload)
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
        method: 'PATCH', // ← cambiado de PUT a PATCH
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
