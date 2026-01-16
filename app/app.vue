<!-- app/app.vue -->
<script setup lang="ts">
useHead({
  titleTemplate: (chunk) => (chunk ? `${chunk} · Tarot` : 'Tarot'),
})

const nuxtApp = useNuxtApp()
const logger = nuxtApp.$logger.child({ scope: 'app.root' })

onErrorCaptured((err, instance, info) => {
  logger.error(err as Error, { info, component: instance?.type?.name ?? 'unknown' })
  return false
})

onMounted(() => {
  logger.info('App mounted', { ssr: nuxtApp.isHydrating })
})

onNuxtReady(() => {
  if (!import.meta.client) return
  logger.info('Nuxt ready')
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <!-- El contenido se renderizará a través del layout default -->
    </NuxtLayout>
  </UApp>
</template>
