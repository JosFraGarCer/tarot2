<!-- app/components/deck/DeckSection.vue -->
<!-- /app/components/deck/DeckSection.vue -->
<template>
  <div>
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <UCard v-for="n in 6" :key="`deck-skeleton-${entity}-${n}`" class="space-y-3">
        <USkeleton class="h-48" />
        <USkeleton class="h-4 w-3/4" />
        <USkeleton class="h-3 w-1/2" />
      </UCard>
    </div>

    <div v-else-if="!limitedItems.length" class="py-10 text-center space-y-2">
      <p class="text-lg font-semibold text-neutral-700 dark:text-neutral-200">{{ t('deck.emptyTitle') }}</p>
      <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ t('deck.emptySubtitle') }}</p>
    </div>

    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <component
          :is="templateComponent"
          v-for="item in limitedItems"
          :key="item.id"
          :class="['shadow-lg shadow-gray-800 bg-default rounded-xl overflow-hidden']"
          :type-label="displayLabel"
          :title="item.name"
          :name="item.name"
          :short-text="item.short_text"
          :description="item.description"
          :img="resolveImage(item.image)"
          :card-info="item.extra"
        />
      </div>

      <PaginationControls
        v-if="paginate && pagination"
        :page="currentPage"
        :page-size="currentPageSize"
        :total-items="totalItems"
        :total-pages="totalPages"
        :page-size-items="pageSizeItems"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n, useAsyncData } from '#imports'
import { useCardViewHelpers } from '~/composables/common/useCardViewHelpers'
import { useCardTemplates } from '~/composables/common/useCardTemplates'
import { useDeckCrud } from '~/composables/deck/useDeckCrud'
import { useEntityPagination } from '~/composables/manage/useEntityPagination'
import type { AnyManageCrud } from '~/types/manage'
import PaginationControls from '@/components/common/PaginationControls.vue'

const props = defineProps<{ entity: string; labelKey: string; label?: string; limit?: number; paginate?: boolean }>()

const { t, locale } = useI18n()

const entityRef = computed(() => props.entity)
const deckCrud = useDeckCrud(entityRef)
const manageCrud = deckCrud.crud

const localeCode = computed(() => (typeof locale === 'string' ? locale : locale.value))

watch(entityRef, (next, prev) => {
  if (next === prev) return
  deckCrud.resetPagination?.()
})

const { pending: initialFetchPending } = useAsyncData(
  () => `deck:${localeCode.value}:${entityRef.value}`,
  async () => {
    if (!deckCrud.crud) return []
    if (deckCrud.items.value.length && !deckCrud.loading.value) {
      return deckCrud.items.value
    }
    return await deckCrud.fetch({ resetPage: false })
  },
  {
    immediate: true,
    server: true,
    watch: [entityRef, localeCode],
  },
)

const pagination = manageCrud ? useEntityPagination(manageCrud as AnyManageCrud) : null

const paginate = computed(() => props.paginate ?? false)
const previewLimit = computed(() => props.limit ?? 6)

watch(
  previewLimit,
  (value) => {
    if (!pagination || !manageCrud?.registerPageSizeOptions) return
    if (!Number.isFinite(value) || value <= 0) return
    manageCrud.registerPageSizeOptions(value)
  },
  { immediate: true },
)

const loading = computed(() => deckCrud.loading.value || initialFetchPending.value)
const items = deckCrud.items

const currentPage = computed(() => (pagination ? pagination.page.value : 1))
const currentPageSize = computed(() => {
  if (paginate.value && pagination) return pagination.pageSize.value
  return previewLimit.value
})

const pageSizeItems = computed(() => {
  if (!pagination) return []

  const base = pagination.defaultPageSizes.value
  const ensureOptions = (...values: number[]) => {
    const map = new Map<number, { label: string; value: number }>()
    for (const option of base) {
      map.set(option.value, option)
    }
    for (const value of values) {
      if (!Number.isFinite(value) || value <= 0) continue
      if (!map.has(value)) {
        map.set(value, { label: String(value), value })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.value - b.value)
  }

  if (!paginate.value) {
    const ensured = ensureOptions(previewLimit.value)
    return ensured.slice(0, Math.min(3, ensured.length))
  }

  return ensureOptions(pagination.pageSize.value)
})

const totalItems = computed(() => (pagination ? pagination.totalItems.value : items.value.length))
const totalPages = computed(() => (pagination ? pagination.totalPages.value : 1))

const limitedItems = computed(() => {
  if (paginate.value) return items.value
  const limit = previewLimit.value
  return limit > 0 ? items.value.slice(0, limit) : items.value
})

const { resolveImage } = useCardViewHelpers({ entity: computed(() => props.entity), locale })
const { resolveTemplate } = useCardTemplates()
const templateComponent = computed(() => resolveTemplate('Class'))
const displayLabel = computed(() => props.label ?? t(props.labelKey))

function ensurePageSize() {
  if (!paginate.value || !pagination) return
  const target = previewLimit.value
  if (target > 0 && pagination.pageSize.value !== target) {
    pagination.onPageSizeChange(target)
  }
}

onMounted(() => {
  ensurePageSize()
})

watch([paginate, entityRef], () => {
  ensurePageSize()
})

function handlePageChange(value: number) {
  if (!pagination) return
  pagination.onPageChange(value)
}

function handlePageSizeChange(value: number) {
  if (!pagination) return
  pagination.onPageSizeChange(value)
}
</script>
