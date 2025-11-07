<!-- /app/pages/manage.vue -->
<template>
  <div class="px-4">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ t('nav.manage') }}
          </h1>
          <ViewControls
            v-model="viewMode"
            v-model:template-key="templateKey"
            class="shrink-0"
            :template-options="templateOptions as any"
          />
        </div>
      </template>

      <UTabs v-model="selectedTab" :items="tabs" :unmount-on-hide="false">
        <template #content="{ item }">
          <ManageEntity
            v-if="currentConfig"
            :key="selectedTab" 
            :label="currentConfig.label"
            :use-crud="currentConfig.useCrud"
            :view-mode="viewMode"
            :entity="item.value"
            :filters-config="currentConfig.filters"
            :card-type="currentConfig.cardType"
            :no-tags="currentConfig.noTags"
            @create="() => onCreateEntity(item.value)"
          />
        </template>
      </UTabs>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '#imports'
import ViewControls from '~/components/manage/ViewControls.vue'
import ManageEntity from '~/components/manage/EntityBase.vue'
import { useManageView } from '~/composables/manage/useManageView'

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
const { viewMode, templateKey, templateOptions } = useManageView()

// Selected tab
const selectedTab = ref<'cardType' | 'baseCard' | 'world' | 'arcana' | 'facet' | 'skill' | 'tag'>('cardType')

// Tab items
const tabs = computed(() => [
  { label: t('nav.cardTypes'), value: 'cardType', icon: 'i-heroicons-squares-2x2' },
  { label: t('nav.baseCards'), value: 'baseCard', icon: 'i-heroicons-rectangle-stack' },
  { label: t('nav.worlds'), value: 'world', icon: 'i-heroicons-map' },
  { label: t('nav.arcana'), value: 'arcana', icon: 'i-heroicons-sparkles' },
  { label: t('nav.facets'), value: 'facet', icon: 'i-heroicons-beaker' },
  { label: t('nav.skills'), value: 'skill', icon: 'i-heroicons-academic-cap' },
  { label: t('nav.tags'), value: 'tag', icon: 'i-heroicons-tag' }
])

// Configuración por entidad
const entityConfigs = {
  cardType: {
    label: t('nav.cardTypes'),
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
    label: t('nav.baseCards'),
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
    label: t('nav.worlds'),
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
    label: t('nav.arcana'),
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
    label: t('nav.facets'),
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
    label: t('nav.skills'),
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
    label: t('nav.tags'),
    useCrud: useTagCrud,
    filters: {
      search: 'search',
      is_active: 'is_active',
      parent: 'parent_id'
    },
    cardType: false,
    noTags: true
  }
} as const

// Config actual según pestaña
const currentConfig = computed(() => entityConfigs[selectedTab.value])

// Acción crear
function onCreateEntity(type: string) {
  console.log('Create new entity:', type)
}
</script>
