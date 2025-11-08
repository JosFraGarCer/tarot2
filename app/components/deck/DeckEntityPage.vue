<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        {{ pageTitle }}
      </h1>
      <p v-if="pageDescription" class="text-sm text-neutral-600 dark:text-neutral-400">
        {{ pageDescription }}
      </p>
    </header>

    <UCard>
      <DeckSection
        :entity="entity"
        :label-key="effectiveLabelKey"
        :label="pageTitle"
        paginate
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'
import DeckSection from '@/components/deck/DeckSection.vue'

const props = defineProps<{
  entity: string
  titleKey: string
  descriptionKey?: string
  labelKey?: string
}>()

const { t } = useI18n()

const entity = computed(() => props.entity)
const pageTitle = computed(() => t(props.titleKey))
const pageDescription = computed(() => (props.descriptionKey ? t(props.descriptionKey) : ''))
const effectiveLabelKey = computed(() => props.labelKey ?? props.titleKey)
</script>
