// app/plugins/auth.server.ts
// /app/plugins/auth.server.ts
// Server-side plugin for hydration of user state from SSR context
// Delegates to useUserStore for unified user management

import { defineNuxtPlugin } from '#app'
import { useUserStore } from '~/stores/user'
import type { UserDTO } from '@/types/api'

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.server) {
    const event = nuxtApp.ssrContext?.event
    const payload = event?.context?.user as UserDTO | undefined

    // Unified hydration method - avoids split logic between null and token
    if (payload) {
      useUserStore().setUser(payload)
    } else {
      useUserStore().logout()
    }
  }
})
