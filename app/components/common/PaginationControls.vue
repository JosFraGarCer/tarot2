<!-- app/components/common/PaginationControls.vue -->

<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
    <!-- Selector de tamaño de página -->
    <div
      v-if="canChangePageSize"
      class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400"
    >
      <span>{{ t('common.pageSize') }}</span>
      <USelectMenu
        :model-value="currentPageSize"
        :items="pageSizeItems"
        :search-input=false
        value-key="value"
        clearable="false"
        size="xs"
        class="w-24"
        @update:model-value="onPageSizeChange"
      />
    </div>

    <!-- Paginación -->
    <UPagination
      v-if="hasPagination"
      v-model:page="paginationModel"
      :total="totalItems"
      :items-per-page="pageSize"
      show-controls
      show-edges
      size="xs"
      color="neutral"
      active-color="primary"
      variant="outline"
      :ui="{
        root: 'flex items-center justify-end gap-2',
        list: 'flex items-center gap-1',
        item: 'h-8 w-8',
        prev: 'h-8 w-8',
        next: 'h-8 w-8'
      }"
      @update:page="onPageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from '#imports'

const props = withDefaults(
  defineProps<{
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    pageSizeItems?: Array<{ label: string; value: number }>
  }>(),
  { pageSizeItems: () => [] }
)

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'update:page-size', value: number): void
}>()

const { t } = useI18n()

const canChangePageSize = computed(() => props.pageSizeItems.length > 1)
const hasPagination = computed(() => props.totalPages > 1)

const currentPageSize = computed(() => props.pageSize)

const paginationModel = ref<number>(props.page)

// Sincronizar prop externa con modelo local
watch(
  () => props.page,
  (value) => {
    if (paginationModel.value !== value) paginationModel.value = value
  }
)

// Emitir cambios al padre
const onPageChange = (value: number | string) => {
  const next = Number(value)
  if (!Number.isFinite(next) || next <= 0) return
  emit('update:page', next)
}

const onPageSizeChange = (value: number | string | null) => {
  const next = Number(value)
  if (!Number.isFinite(next) || next <= 0) return
  emit('update:pageSize', next)
  emit('update:page-size', next)
}
</script>
