// /app/plugins/auth.server.ts
import { defineNuxtPlugin } from '#app'
import { useUserStore } from '~/stores/user'
import type { UserDTO } from '@/types/api'

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) {
    const event = nuxtApp.ssrContext?.event
    const payload = event?.context?.user as UserDTO | undefined
    const store = useUserStore(nuxtApp.$pinia)

    if (payload) {
      store.setUser(payload)
    } else {
      store.setUser(null)
      store.setToken(null)
    }
  }
})
