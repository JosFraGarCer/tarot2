<template>
  <div class="flex h-screen bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
    <!-- Sidebar Colapsable -->
    <aside 
      class="flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all duration-300 ease-in-out relative z-20"
      :class="[isSidebarOpen ? 'w-64' : 'w-16']"
    >
      <!-- Toggle Button Sidebar -->
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-heroicons-bars-3"
        class="absolute -right-4 top-4 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm"
        size="xs"
        @click="isSidebarOpen = !isSidebarOpen"
      />

      <div class="flex flex-col flex-1 gap-2 p-3 overflow-hidden">
        <div v-for="item in menuItems" :key="item.label" class="flex items-center gap-3">
          <UTooltip :text="item.label" :prevent="isSidebarOpen" side="right">
            <UButton
              :icon="item.icon"
              color="neutral"
              variant="ghost"
              :class="['flex-shrink-0', isSidebarOpen ? 'w-full justify-start' : 'w-10 justify-center']"
            >
              <span v-if="isSidebarOpen" class="truncate font-medium">{{ item.label }}</span>
            </UButton>
          </UTooltip>
        </div>
      </div>
    </aside>

    <!-- Contenido Principal -->
    <main class="flex-1 flex flex-col min-w-0">
      <!-- Header de Entidad Moderno -->
      <header class="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 p-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
          <!-- Título y View Switcher -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-rectangle-stack" class="h-6 w-6 text-primary-500" />
              <h1 class="text-xl font-bold text-neutral-900 dark:text-neutral-50 truncate">Base Cards</h1>
              <UBadge color="neutral" variant="soft" size="xs">124</UBadge>
            </div>
            
            <UDivider orientation="vertical" class="h-6 hidden sm:block" />

            <!-- View Switcher Unificado -->
            <UButtonGroup size="sm" variant="soft" color="neutral">
              <UTooltip text="Vista Tarjeta">
                <UButton icon="i-heroicons-square-3-stack-3d" :color="viewMode === 'tarjeta' ? 'primary' : 'neutral'" @click="viewMode = 'tarjeta'" />
              </UTooltip>
              <UTooltip text="Vista Classic">
                <UButton icon="i-heroicons-view-columns" :color="viewMode === 'classic' ? 'primary' : 'neutral'" @click="viewMode = 'classic'" />
              </UTooltip>
              <UTooltip text="Vista Carta">
                <UButton icon="i-heroicons-rectangle-stack" :color="viewMode === 'carta' ? 'primary' : 'neutral'" @click="viewMode = 'carta'" />
              </UTooltip>
              <UTooltip text="Vista Tabla">
                <UButton icon="i-heroicons-table-cells" :color="viewMode === 'tabla' ? 'primary' : 'neutral'" @click="viewMode = 'tabla'" />
              </UTooltip>
            </UButtonGroup>
          </div>

          <!-- Acciones Principales -->
          <div class="flex items-center gap-2">
            <UInput icon="i-heroicons-magnifying-glass" size="sm" placeholder="Buscar..." class="w-48 sm:w-64" />
            <UButton icon="i-heroicons-plus" color="primary" label="Create" />
          </div>
        </div>

        <!-- Barra de Filtros Colapsable (Opcional) -->
        <div class="mt-4 flex flex-wrap gap-2 max-w-7xl mx-auto w-full">
           <USelectMenu placeholder="Tags" class="w-32" size="xs" />
           <USelectMenu placeholder="Card Type" class="w-32" size="xs" />
           <USelectMenu placeholder="Status" class="w-32" size="xs" />
           <UButton variant="ghost" color="neutral" icon="i-heroicons-funnel" size="xs">More</UButton>
        </div>
      </header>

      <!-- Grid de Cartas con Scroll Independiente -->
      <section class="flex-1 overflow-y-auto p-4 lg:p-6 bg-neutral-50 dark:bg-neutral-950">
        <div class="max-w-7xl mx-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div v-for="n in 12" :key="n" class="aspect-[2/3] bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col animate-pulse">
               <div class="flex-1 bg-neutral-200 dark:bg-neutral-800"></div>
               <div class="h-20 p-3 space-y-2">
                 <div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4"></div>
                 <div class="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2"></div>
               </div>
            </div>
          </div>
          
          <!-- Paginación Fija/Footer -->
          <footer class="mt-8 py-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <p class="text-sm text-neutral-500">Showing 1-12 of 124 cards</p>
            <UPagination v-model="page" :total="124" :page-count="12" />
          </footer>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isSidebarOpen = ref(true)
const viewMode = ref('tarjeta')
const page = ref(1)

const menuItems = [
  { label: 'Card Types', icon: 'i-heroicons-square-2-stack' },
  { label: 'Base Cards', icon: 'i-heroicons-rectangle-stack' },
  { label: 'Worlds', icon: 'i-heroicons-globe-alt' },
  { label: 'Arcana', icon: 'i-heroicons-sparkles' },
  { label: 'Facets', icon: 'i-heroicons-finger-print' },
  { label: 'Skills', icon: 'i-heroicons-bolt' },
  { label: 'Tags', icon: 'i-heroicons-tag' }
]
</script>

<style scoped>
/* Transiciones suaves para el layout */
.flex {
  transition: all 0.3s ease-in-out;
}
</style>
