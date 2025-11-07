<!-- /app/components/manage/filters/ManageEntityFilters.vue -->
<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <UInput
          v-model="crud.filters.search"
          size="xs"
          :placeholder="t('common.search')"
          class="w-56"
          icon="i-heroicons-magnifying-glass-20-solid"
        />

        <USelectMenu
          v-if="show.tags"
          v-model="crud.filters.tags"
          :items="tagOptions"
          multiple
          size="xs"
          value-key="value"
          class="w-56"
          :placeholder="t('common.tags')"
        />
        <USelectMenu
          v-if="show.facet"
          v-model="crud.filters.facet"
          :items="facetOptions"
          multiple
          size="xs"
          value-key="value"
          class="w-40"
          :placeholder="t('entities.facet')"
        />
        <USelectMenu
          v-if="show.type"
          v-model="crud.filters.type"
          :items="typeOptions"
          multiple
          size="xs"
          value-key="value"
          class="w-40"
          :placeholder="t('common.type')"
        />
        <USelectMenu
          v-if="show.status"
          v-model="crud.filters.status"
          :items="statusOptions"
          size="xs"
          value-key="value"
          class="w-40"
          :placeholder="t('common.status')"
        />
        <USelectMenu
          v-if="show.isActive"
          v-model="crud.filters.isActive"
          :items="isActiveOptions"
          size="xs"
          value-key="value"
          class="w-40"
          :placeholder="t('common.active')"
        />
      </div>

      <div class="flex items-center gap-2" v-can.disable="['canEditContent','canPublish']">
        <UButton
          icon="i-heroicons-plus-20-solid"
          size="xs"
          color="primary"
          :label="t('common.create')"
          @click="onCreate?.()"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'

const props = withDefaults(defineProps<{
  crud: any
  config?: Record<string, boolean>
  label: string
  noTags?: boolean
  cardType?: boolean
  onCreate?: () => void
}>(), {
  config: () => ({}),
  noTags: false,
  cardType: false,
  onCreate: undefined
})

const { t } = useI18n()

const show = computed(() => ({
  search: !!props.config?.search,
  tags: !!props.config?.tags,
  facet: !!props.config?.facet,
  type: !!props.config?.type,
  status: !!props.config?.status,
  // accept both keys; prefer config.isActive but honor config.is_active if present
  isActive: !!(props.config?.isActive ?? props.config?.is_active)
}))

const isActiveOptions = computed(() => ([
  { label: t('filters.all'), value: null },
  { label: t('common.active'), value: true },
  { label: t('common.inactive'), value: false }
]))

const statusOptions = computed(() => ([] as Array<{ label: string; value: string }>))
const tagOptions = computed(() => ([] as Array<{ label: string; value: string | number }>))
const facetOptions = computed(() => ([] as Array<{ label: string; value: string | number }>))
const typeOptions = computed(() => ([] as Array<{ label: string; value: string | number }>))
</script>