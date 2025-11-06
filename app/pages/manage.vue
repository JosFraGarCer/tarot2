<!-- app/pages/manage.vue -->
<template>
  <div class="px-4">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ $t('nav.manage') }} 
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
          {{ item }}
          <!-- <ManageCardTypes v-if="item.value === 'cardTypes'" />
          <ManageBaseCards v-else-if="item.value === 'baseCards'" />
          <ManageWorlds v-else-if="item.value === 'worlds'" />
          <ManageArcana v-else-if="item.value === 'arcana'" />
          <ManageFacets v-else-if="item.value === 'facets'" />
          <ManageSkills v-else-if="item.value === 'skills'" />
          <div v-else-if="item.value === 'tags'" v-can="['canAssignTags']">
            <ManageTags  />
          </div> -->
        </template>
      </UTabs>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import ViewControls from '~/components/manage/ViewControls.vue'
import { useManageView } from '~/composables/manage/useManageView'
definePageMeta({
  layout: 'default',
})

const { t } = useI18n()

const { viewMode, templateKey } = useManageView()

const selectedTab = ref<'cardTypes' | 'baseCards' | 'worlds' | 'arcana' | 'facets' | 'skills' | 'tags'>('cardTypes')

const tabs = computed(() => [
  {
    label: t('nav.cardTypes'),
    value: 'cardTypes',
    icon: 'i-heroicons-squares-2x2'
  },
  {
    label: t('nav.baseCards'),
    value: 'baseCards',
    icon: 'i-heroicons-rectangle-stack'
  },
  {
    label: t('nav.worlds'),
    value: 'worlds',
    icon: 'i-heroicons-map'
  },
  {
    label: t('nav.arcana'),
    value: 'arcana',
    icon: 'i-heroicons-sparkles'
  },
  {
    label: t('nav.facets'),
    value: 'facets',
    icon: 'i-heroicons-beaker'
  },
  {
    label: t('nav.skills'),
    value: 'skills',
    icon: 'i-heroicons-academic-cap'
  },
  {
    label: t('nav.tags'),
    value: 'tags',
    icon: 'i-heroicons-tag'
  }
])
</script>
