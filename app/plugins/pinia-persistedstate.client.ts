// app/plugins/pinia-persistedstate.client.ts
// /app/plugins/pinia-persistedstate.client.ts
import { defineNuxtPlugin } from '#app'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin(({ $pinia }) => {
  $pinia?.use(piniaPluginPersistedstate)
})
