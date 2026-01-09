<!-- app/pages/manage.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n, useServerSeoMeta } from '#imports'
import ManageEntity from '~/components/manage/EntityBase.vue'
import { useManageView } from '~/composables/manage/useManageView'
import type { AnyManageCrud } from '~/types/manage'

// Composables CRUD
import { useWorldCrud } from '~/composables/manage/useWorld'
import { useArcanaCrud } from '~/composables/manage/useArcana'
import { useFacetCrud } from '~/composables/manage/useFacet'
import { useSkillCrud } from '~/composables/manage/useSkill'
import { useCardTypeCrud } from '~/composables/manage/useCardType'
import { useBaseCardCrud } from '~/composables/manage/useBaseCard'
import { useTagCrud } from '~/composables/manage/useTag'

definePageMeta({ layout: 'default' })
const { t } = useI18n()

useServerSeoMeta({
  title: () => `${t('navigation.menu.manage')} | Tarot`,
  description: () => t('navigation.manage.description', 'Panel de gestión administrativa de entidades de Tarot.'),
})

const { viewMode, templateKey } = useManageView({ storageKey: 'manage' })

type EntityKey = 'cardType' | 'baseCard' | 'world' | 'arcana' | 'facet' | 'skill' | 'tag'

const activeEntityKey = ref<EntityKey>('cardType')
const isSidebarOpen = ref(false)

const menuItems = computed(() => [
  { value: 'cardType', label: t('navigation.menu.cardTypes'), icon: 'i-heroicons-squares-2x2' },
  { value: 'baseCard', label: t('navigation.menu.baseCards'), icon: 'i-heroicons-rectangle-stack' },
  { value: 'world', label: t('navigation.menu.worlds'), icon: 'i-heroicons-map' },
  { value: 'arcana', label: t('navigation.menu.arcana'), icon: 'i-heroicons-sparkles' },
  { value: 'facet', label: t('navigation.menu.facets'), icon: 'i-heroicons-beaker' },
  { value: 'skill', label: t('navigation.menu.skills'), icon: 'i-heroicons-academic-cap' },
  { value: 'tag', label: t('navigation.menu.tags'), icon: 'i-heroicons-tag' }
])

// Configuración por entidad
const entityConfigs: Record<EntityKey, {
  label: string
  icon: string
  useCrud: any
  filters: Record<string, string>
  cardType: boolean
  noTags: boolean
}> = {
  cardType: {
    label: t('navigation.menu.cardTypes'),
    icon: 'i-heroicons-squares-2x2',
    useCrud: useCardTypeCrud,
    filters: { search: 'search', status: 'status', is_active: 'is_active' },
    cardType: false,
    noTags: true
  },
  baseCard: {
    label: t('navigation.menu.baseCards'),
    icon: 'i-heroicons-rectangle-stack',
    useCrud: useBaseCardCrud,
    filters: { search: 'search', status: 'status', is_active: 'is_active', type: 'card_type_id', tags: 'tag_ids' },
    cardType: true,
    noTags: false
  },
  world: {
    label: t('navigation.menu.worlds'),
    icon: 'i-heroicons-map',
    useCrud: useWorldCrud,
    filters: { search: 'search', status: 'status', is_active: 'is_active', tags: 'tag_ids' },
    cardType: false,
    noTags: false
  },
  arcana: {
    label: t('navigation.menu.arcana'),
    icon: 'i-heroicons-sparkles',
    useCrud: useArcanaCrud,
    filters: { search: 'search', status: 'status', is_active: 'is_active', tags: 'tag_ids' },
    cardType: false,
    noTags: false
  },
  facet: {
    label: t('navigation.menu.facets'),
    icon: 'i-heroicons-beaker',
    useCrud: useFacetCrud,
    filters: { search: 'search', status: 'status', is_active: 'is_active', facet: 'arcana_id', tags: 'tag_ids' },
    cardType: false,
    noTags: false
  },
  skill: {
    label: t('navigation.menu.skills'),
    icon: 'i-heroicons-academic-cap',
    useCrud: useSkillCrud,
    filters: { search: 'search', status: 'status', is_active: 'is_active', facet: 'facet_id', tags: 'tag_ids' },
    cardType: false,
    noTags: false
  },
  tag: {
    label: t('navigation.menu.tags'),
    icon: 'i-heroicons-tag',
    useCrud: useTagCrud,
    filters: { search: 'search', is_active: 'is_active', parent: 'parent_id' },
    cardType: false,
    noTags: true
  }
}

const activeEntityConfig = computed(() => entityConfigs[activeEntityKey.value])
</script>

<template>
  <div class="flex h-[calc(100vh-4rem)] overflow-hidden bg-neutral-50 dark:bg-neutral-950 font-sans">
    <!-- Sidebar Colapsable Modernizada -->
    <aside
      class="flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] relative z-30 shadow-xl lg:shadow-none"
      :class="[isSidebarOpen ? 'w-48' : 'w-16']">
      <!-- Toggle Button Sidebar -->
      <button
        class="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-md flex items-center justify-center hover:scale-110 transition-transform z-40 hidden lg:flex"
        @click="isSidebarOpen = !isSidebarOpen">
        <UIcon :name="isSidebarOpen ? 'i-heroicons-chevron-left' : 'i-heroicons-chevron-right'"
          class="w-3.5 h-3.5 text-neutral-500" />
      </button>

      <!-- Menú de Navegación -->
      <nav class="flex-1 flex flex-col gap-1.5 py-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div v-for="item in menuItems" :key="item.value">
          <UTooltip :text="item.label" :prevent="isSidebarOpen" side="right" :popper="{ offsetDistance: 12 }">
            <UButton :icon="item.icon" color="neutral" variant="ghost" :class="[
              'group relative transition-all duration-200 h-11',
              isSidebarOpen ? 'w-full justify-start px-4' : 'w-full justify-center px-0',
              activeEntityKey === item.value ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            ]" @click="activeEntityKey = item.value as EntityKey">
              <span v-if="isSidebarOpen" class="truncate font-medium text-sm">{{ item.label }}</span>
              <!-- Active Indicator -->
              <div v-if="activeEntityKey === item.value"
                class="absolute left-0 w-1 h-6 bg-primary-500 rounded-r-full" />
            </UButton>
          </UTooltip>
        </div>
      </nav>
    </aside>

    <!-- Área de Contenido Principal -->
    <main class="flex-1 flex flex-col min-w-0 bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
      <ManageEntity v-if="activeEntityConfig" :key="activeEntityKey" :label="activeEntityConfig.label"
        :use-crud="activeEntityConfig.useCrud" v-model:view-mode="viewMode" :template-key="templateKey"
        :entity="activeEntityKey" :filters-config="activeEntityConfig.filters" :card-type="activeEntityConfig.cardType"
        :no-tags="activeEntityConfig.noTags" class="h-full" />
    </main>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e5e5;
  border-radius: 10px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #262626;
}
</style>
