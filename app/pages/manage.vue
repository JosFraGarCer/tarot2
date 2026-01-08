<!-- app/pages/manage.vue -->
<!-- /app/pages/manage.vue -->
<template>
  <div class="flex h-[calc(100vh-4rem)] overflow-hidden">
    <!-- Sidebar Vertical para Navegación de Entidades -->
    <aside class="w-64 border-r bg-neutral-50/50 dark:bg-neutral-900/50 hidden lg:flex flex-col shrink-0">
      <div class="p-4 border-b">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ t('navigation.menu.manage') }}
        </h1>
      </div>
      <div class="flex-1 overflow-y-auto p-4">
        <UNavigationMenu
          orientation="vertical"
          :items="sidebarTabs"
          class="w-full"
        >
          <template #item-label="{ item }">
            <div class="flex flex-col py-1">
              <span class="text-sm font-medium">{{ item.label }}</span>
            </div>
          </template>
        </UNavigationMenu>
      </div>
      <div class="p-4 border-t">
        <ClientOnly>
          <template #fallback>
            <div class="h-8 w-full rounded bg-default/40" />
          </template>
          <ViewControls
            v-model="viewMode"
            v-model:template-key="templateKey"
            class="w-full"
            :template-options="templateOptions as any"
            storage-key="manage"
          />
        </ClientOnly>
      </div>
    </aside>

    <!-- Área de Contenido Principal -->
    <main class="flex-1 overflow-y-auto p-4 lg:p-6">
      <!-- Tabs para Mobile (cuando el aside está oculto) -->
      <div class="lg:hidden mb-6">
        <UTabs v-model="selectedTabIndex" :items="tabs" class="w-full" />
      </div>

      <UCard class="h-full flex flex-col" :ui="{ body: 'flex-1 overflow-hidden p-0 sm:p-0' }">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <UIcon :name="activeEntityConfig.icon" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold">{{ activeEntityConfig.label }}</h2>
            </div>
          </div>
        </template>

        <ManageEntity
          v-if="activeEntityConfig"
          :key="activeEntityKey"
          :label="activeEntityConfig.label"
          :use-crud="activeEntityConfig.useCrud"
          :view-mode="viewMode"
          :template-key="templateKey"
          :entity="activeEntityKey"
          :filters-config="activeEntityConfig.filters"
          :card-type="activeEntityConfig.cardType"
          :no-tags="activeEntityConfig.noTags"
          class="h-full"
          @create="() => onCreateEntity(activeEntityKey)"
        />

        <div class="mt-6 px-4 pb-4">
          <NuxtPage />
        </div>
      </UCard>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n, useServerSeoMeta } from '#imports'
import ViewControls from '~/components/manage/ViewControls.vue'
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
  ogTitle: () => `${t('navigation.menu.manage')} | Tarot`,
  ogDescription: () => t('navigation.manage.description', 'Panel de gestión administrativa de entidades de Tarot.'),
  twitterCard: 'summary_large_image',
})

const { viewMode, templateKey, templateOptions } = useManageView({ storageKey: 'manage' })

type EntityKey = 'cardType' | 'baseCard' | 'world' | 'arcana' | 'facet' | 'skill' | 'tag'

// State for active entity
const activeEntityKey = ref<EntityKey>('cardType')

// Tab items
const tabs = computed(() => [
  { label: t('navigation.menu.cardTypes'), value: 'cardType', icon: 'i-heroicons-squares-2x2' },
  { label: t('navigation.menu.baseCards'), value: 'baseCard', icon: 'i-heroicons-rectangle-stack' },
  { label: t('navigation.menu.worlds'), value: 'world', icon: 'i-heroicons-map' },
  { label: t('navigation.menu.arcana'), value: 'arcana', icon: 'i-heroicons-sparkles' },
  { label: t('navigation.menu.facets'), value: 'facet', icon: 'i-heroicons-beaker' },
  { label: t('navigation.menu.skills'), value: 'skill', icon: 'i-heroicons-academic-cap' },
  { label: t('navigation.menu.tags'), value: 'tag', icon: 'i-heroicons-tag' }
])

// Sidebar mapping
const sidebarTabs = computed(() => tabs.value.map(tab => ({
  ...tab,
  active: activeEntityKey.value === tab.value,
  onSelect: () => { activeEntityKey.value = tab.value as EntityKey }
})))

// Selected tab index for mobile UTabs
const selectedTabIndex = computed({
  get: () => {
    const index = tabs.value.findIndex(t => t.value === activeEntityKey.value)
    return index === -1 ? 0 : index
  },
  set: (val) => { 
    if (tabs.value[val]) {
      activeEntityKey.value = tabs.value[val].value as EntityKey
    }
  }
})

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
    filters: {
      search: 'search',
      status: 'status',
      is_active: 'is_active'
    },
    cardType: false,
    noTags: true
  },
  baseCard: {
    label: t('navigation.menu.baseCards'),
    icon: 'i-heroicons-rectangle-stack',
    useCrud: useBaseCardCrud,
    filters: {
      search: 'search',
      status: 'status',
      is_active: 'is_active',
      type: 'card_type_id',
      tags: 'tag_ids'
    },
    cardType: true,
    noTags: false
  },
  world: {
    label: t('navigation.menu.worlds'),
    icon: 'i-heroicons-map',
    useCrud: useWorldCrud,
    filters: {
      search: 'search',
      status: 'status',
      is_active: 'is_active',
      tags: 'tag_ids'
    },
    cardType: false,
    noTags: false
  },
  arcana: {
    label: t('navigation.menu.arcana'),
    icon: 'i-heroicons-sparkles',
    useCrud: useArcanaCrud,
    filters: {
      search: 'search',
      status: 'status',
      is_active: 'is_active',
      tags: 'tag_ids'
    },
    cardType: false,
    noTags: false
  },
  facet: {
    label: t('navigation.menu.facets'),
    icon: 'i-heroicons-beaker',
    useCrud: useFacetCrud,
    filters: {
      search: 'search',
      status: 'status',
      is_active: 'is_active',
      facet: 'arcana_id',
      tags: 'tag_ids'
    },
    cardType: false,
    noTags: false
  },
  skill: {
    label: t('navigation.menu.skills'),
    icon: 'i-heroicons-academic-cap',
    useCrud: useSkillCrud,
    filters: {
      search: 'search',
      status: 'status',
      is_active: 'is_active',
      facet: 'facet_id',
      tags: 'tag_ids'
    },
    cardType: false,
    noTags: false
  },
  tag: {
    label: t('navigation.menu.tags'),
    icon: 'i-heroicons-tag',
    useCrud: useTagCrud,
    filters: {
      search: 'search',
      is_active: 'is_active',
      parent: 'parent_id'
    },
    cardType: false,
    noTags: true
  }
}

const activeEntityConfig = computed(() => entityConfigs[activeEntityKey.value])

// Acción crear
function onCreateEntity(type: EntityKey) {
  console.log('Create new entity:', type)
}
</script>
