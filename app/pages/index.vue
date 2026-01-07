<template>
  <div class="max-w-4xl mx-auto py-12 px-4 space-y-8">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-sky-600">
            Tarot2 Ecosystem
          </h1>
          <UBadge color="primary" variant="subtle">Vanguard Engine</UBadge>
        </div>
      </template>
      
      <div class="prose dark:prose-invert max-w-none">
        <p class="text-lg text-neutral-600 dark:text-neutral-400">
          Bienvenido al futuro de los sistemas de role-play. Tarot2 está ahora impulsado por una arquitectura de vanguardia basada en 
          <strong>Nuxt 5 (Future Compatibility)</strong>, optimizada para ofrecer el máximo rendimiento y una experiencia de usuario fluida.
        </p>
      </div>

      <template #footer>
        <div class="flex gap-4">
          <UButton to="/manage" icon="i-heroicons-cog-6-tooth" color="primary">
            Gestionar Entidades
          </UButton>
          <UButton to="/deck" icon="i-heroicons-rectangle-stack" variant="outline">
            Explorar Mazos
          </UButton>
        </div>
      </template>
    </UCard>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-4">
        <h2 class="text-sm font-semibold text-neutral-400 uppercase tracking-widest px-1">Infrastructure Status</h2>
        <ClientOnly>
          <ServerStatusIsland />
        </ClientOnly>
      </div>
      
      <div class="space-y-4">
        <h2 class="text-sm font-semibold text-neutral-400 uppercase tracking-widest px-1">Performance Metrics</h2>
        <UCard class="bg-neutral-50/50 dark:bg-neutral-900/50">
          <div class="space-y-3">
            <div class="flex justify-between items-center text-sm">
              <span class="text-neutral-500">Reactivity Mode</span>
              <span class="font-mono text-primary-500">Nuxt 5 Shallow</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-neutral-500">SSR Optimization</span>
              <span class="font-mono text-primary-500">useServerSeoMeta()</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-neutral-500">Payload Security</span>
              <span class="font-mono text-primary-500">Native H3 Validated</span>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n, useServerSeoMeta } from '#imports'
import ServerStatusIsland from '~/components/islands/ServerStatusIsland.vue'

const { t } = useI18n()

useServerSeoMeta({
  title: 'Tarot2 | Vanguard Role-Play System',
  description: 'Sistema de role-play de última generación optimizado con Nuxt 5.',
  ogTitle: 'Tarot2 | Vanguard Role-Play System',
  ogDescription: 'Sistema de role-play de última generación optimizado con Nuxt 5.',
  twitterCard: 'summary_large_image',
})
</script>
