<!-- /app/components/manage/views/ManageEntityTable.vue -->
<template>
  <EntityTable
    :rows="tableRows"
    :loading="tableLoading"
    :columns="columns"
    :selected-ids="selectedIds"
    @update:selected-ids="onUpdateSelected"
    @export-selected="(ids) => emit('export', ids)"
    @update-selected="(ids) => emit('batchUpdate', ids)"
  >
    <template #empty>
      <div class="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <UIcon name="i-heroicons-magnifying-glass-circle" class="h-14 w-14 text-neutral-300 dark:text-neutral-600" />
        <div class="space-y-2">
          <p class="text-lg font-semibold text-neutral-700 dark:text-neutral-200">{{ emptyTitle }}</p>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ emptySubtitle }}</p>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <UButton color="primary" icon="i-heroicons-plus" @click="emit('create')">
            {{ emptyCreateLabel }}
          </UButton>
          <UButton
            variant="ghost"
            color="neutral"
            icon="i-heroicons-arrow-path"
            @click="emit('reset-filters')"
          >
            {{ emptyResetLabel }}
          </UButton>
        </div>
      </div>
    </template>
    <template #loading>
      <div class="space-y-2 py-6">
        <USkeleton v-for="n in 6" :key="`row-skeleton-${n}`" class="h-10 w-full rounded" />
      </div>
    </template>
    <template #actions="{ row }">
      <div class="flex items-center gap-1">
        <UButton
          icon="i-heroicons-pencil"
          color="primary"
          variant="soft"
          size="xs"
          aria-label="Edit"
          @click="emit('edit', row.raw ?? row)"
        />
        <UButton
          icon="i-heroicons-trash"
          color="error"
          variant="soft"
          size="xs"
          aria-label="Delete"
          @click="emit('delete', row.raw ?? row)"
        />
      </div>
    </template>
  </EntityTable>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '#imports'
import EntityTable from '~/components/manage/view/EntityTable.vue'
import type { EntityRow } from '~/components/manage/view/EntityTable.vue'
import type { ManageCrud } from '@/types/manage'

const props = defineProps<{
  crud: ManageCrud
  label: string
  columns?: any[]
}>()

const emit = defineEmits<{
  (e: 'edit', entity: any): void
  (e: 'delete', entity: any): void
  (e: 'export', ids: number[]): void
  (e: 'batchUpdate', ids: number[]): void
  (e: 'create'): void
  (e: 'reset-filters'): void
}>()

const selectedIds = ref<number[]>([])

const { t } = useI18n()

const tableRows = computed<EntityRow[]>(() => {
  const raw = props.crud.items.value
  return raw.map((entity) => normalizeEntity(entity))
})

const tableLoading = computed<boolean>(() => {
  return props.crud.loading.value
})

function normalizeEntity(entity: any): EntityRow {
  const id = Number(entity?.id ?? entity?.uuid ?? entity?.code ?? 0)
  const name = entity?.name
    ?? entity?.title
    ?? entity?.label
    ?? entity?.code
    ?? `#${entity?.id ?? '—'}`
  const shortText = entity?.short_text ?? entity?.summary ?? ''
  const description = entity?.description ?? entity?.long_text ?? ''
  const status = entity?.status ?? entity?.state ?? null
  const isActive = entity?.is_active ?? entity?.isActive ?? null
  const image = resolveImage(entity)
  const tags = Array.isArray(entity?.tags)
    ? entity.tags.map((t: any) => t?.name ?? t?.label ?? t?.code ?? '').filter(Boolean).join(', ')
    : null

  return {
    id: Number.isFinite(id) && id > 0 ? id : Number(entity?.id) || 0,
    name,
    short_text: shortText,
    description,
    status: typeof status === 'string' ? status : null,
    is_active: typeof isActive === 'boolean' ? isActive : null,
    img: image,
    code: entity?.code ?? null,
    lang: entity?.language_code_resolved ?? entity?.language_code ?? entity?.lang ?? null,
    card_type: entity?.card_type_name ?? entity?.card_type_code ?? null,
    arcana: entity?.arcana_name ?? entity?.arcana_code ?? null,
    facet: entity?.facet_name ?? entity?.facet_code ?? null,
    parent: entity?.parent_name ?? entity?.parent_code ?? null,
    category: entity?.category ?? null,
    tags,
    updated_at: entity?.updated_at ?? null,
    raw: entity,
  }
}

function resolveImage(entity: any): string | null {
  const src = entity?.image || entity?.thumbnail_url || entity?.img || null
  if (!src || typeof src !== 'string') return null
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) return src
  if (entity?.entity_type) return `/img/${entity.entity_type}/${src}`
  return src
}

function onUpdateSelected(ids: number[]) {
  selectedIds.value = ids
}

const emptyTitle = computed(() => t('common.noResults'))
const emptySubtitle = computed(() => t('common.tryAdjustFilters'))
const emptyCreateLabel = computed(() => `${t('common.create')} ${props.label}`)
const emptyResetLabel = computed(() => t('common.resetFilters'))
</script>