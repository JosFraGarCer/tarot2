<!-- app/pages/deck/index.vue -->
<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        {{ t('deck.title') }}
      </h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400">
        {{ t('deck.subtitle') }}
      </p>
    </header>

    <UTabs v-model="currentTab" :items="tabs">
      <template #content="{ item }">
        <UCard class="space-y-4">
          <div class="flex justify-between items-center gap-3">
            <div>
              <h2 class="text-xl font-semibold">{{ item.label }}</h2>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">{{ item.description }}</p>
            </div>
            <UButton
              variant="soft"
              color="primary"
              icon="i-heroicons-arrow-top-right-on-square"
              :to="localePath(item.to)"
              :label="t('deck.viewAll')"
            />
          </div>
          <DeckSection :entity="item.entity" :label-key="item.labelKey" :label="item.label" paginate />
        </UCard>
      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '#imports'
import DeckSection from '@/components/deck/DeckSection.vue'
import { useLocalePath } from '#i18n'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const localePath = useLocalePath()

const tabs = computed(() => ([
  {
    value: 'cardType',
    entity: 'cardType',
    labelKey: 'navigation.menu.cardTypes',
    label: t('navigation.menu.cardTypes'),
    descriptionKey: 'deck.cardTypesDescription',
    description: t('deck.cardTypesDescription'),
    to: '/deck/card-types'
  },
  {
    value: 'baseCard',
    entity: 'baseCard',
    labelKey: 'navigation.menu.baseCards',
    label: t('navigation.menu.baseCards'),
    descriptionKey: 'deck.baseCardsDescription',
    description: t('deck.baseCardsDescription'),
    to: '/deck/base-cards'
  },
  {
    value: 'world',
    entity: 'world',
    labelKey: 'navigation.menu.worlds',
    label: t('navigation.menu.worlds'),
    descriptionKey: 'deck.worldsDescription',
    description: t('deck.worldsDescription'),
    to: '/deck/worlds'
  },
  {
    value: 'arcana',
    entity: 'arcana',
    labelKey: 'navigation.menu.arcana',
    label: t('navigation.menu.arcana'),
    descriptionKey: 'deck.arcanaDescription',
    description: t('deck.arcanaDescription'),
    to: '/deck/arcana'
  },
  {
    value: 'facet',
    entity: 'facet',
    labelKey: 'navigation.menu.facets',
    label: t('navigation.menu.facets'),
    descriptionKey: 'deck.facetsDescription',
    description: t('deck.facetsDescription'),
    to: '/deck/facets'
  },
  {
    value: 'skill',
    entity: 'skill',
    labelKey: 'navigation.menu.skills',
    label: t('navigation.menu.skills'),
    descriptionKey: 'deck.skillsDescription',
    description: t('deck.skillsDescription'),
    to: '/deck/skills'
  }
]))

const currentTab = ref('cardType')
</script>
