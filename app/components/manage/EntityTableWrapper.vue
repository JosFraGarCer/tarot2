<!-- app/components/manage/EntityTableWrapper.vue -->
<!-- /app/components/manage/views/ManageEntityTable.vue -->
<template>
  <EntityTable
    :rows="tableRows"
    :loading="tableLoading"
    :columns="columns"
    :selected-ids="selectedIds"
    :crud="crudResource"
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
          :aria-label="t('ui.actions.quickEdit', 'Edición rápida')"
          @click="emit('edit', row.raw ?? row)"
        />
        <UButton
          icon="i-heroicons-arrows-pointing-out"
          color="primary"
          variant="ghost"
          size="xs"
          :aria-label="t('ui.actions.fullEdit', 'Edición completa')"
          @click="handleFullEdit(row)"
        />
        <UButton
          v-if="row.raw && canFeedback(row.raw)"
          icon="i-heroicons-exclamation-triangle"
          color="warning"
          variant="soft"
          size="xs"
          aria-label="Feedback"
          @click="emit('feedback', row.raw ?? row)"
        />
        <UButton
          v-if="row.raw && canTags(row.raw)"
          icon="i-heroicons-tag"
          color="neutral"
          variant="soft"
          size="xs"
          aria-label="Tags"
          @click="emit('tags', row.raw ?? row)"
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
import { computed } from 'vue'
import { useI18n } from '#imports'
import EntityTable from '~/components/manage/view/EntityTable.vue'
import type { EntityRow } from '~/components/manage/view/EntityTable.vue'
import type { ManageCrud } from '@/types/manage'
import { useTableSelection } from '@/composables/common/useTableSelection'
import { useEntityCapabilities } from '~/composables/common/useEntityCapabilities'
import { mapEntityToRow } from '~/utils/manage/entityRows'

const props = defineProps<{
  crud: ManageCrud
  label: string
  columns?: unknown[]
  noTags?: boolean
  entity?: string
}>()

const emit = defineEmits<{
  (e: 'edit', entity: Record<string, unknown>): void
  (e: 'full-edit', id: number): void
  (e: 'delete', entity: Record<string, unknown>): void
  (e: 'export', ids: number[]): void
  (e: 'batchUpdate', ids: number[]): void
  (e: 'create'): void
  (e: 'reset-filters'): void
  (e: 'feedback', entity: Record<string, unknown>): void
  (e: 'tags', entity: Record<string, unknown>): void
}>()

const selection = useTableSelection(() => props.crud.items.value.map(item => item?.id ?? item?.uuid ?? item?.code))
const selectedIds = selection.selectedList

const resourcePath = computed(() => props.crud?.resourcePath || '')
const crudResource = computed(() => ({ resourcePath: resourcePath.value }))

const { t } = useI18n()
const capabilities = useEntityCapabilities()

const allowTags = computed(() => {
  if (props.noTags === true) return false
  if (props.noTags === false) return true
  return capabilities.value.hasTags !== false
})

const tableRows = computed<EntityRow[]>(() => {
  const raw = props.crud.items.value
  return raw.map((entity) => mapEntityToRow(entity, {
    resourcePath: resourcePath.value,
    label: props.label,
    entity: props.entity,
  }))
})

const tableLoading = computed<boolean>(() => {
  return props.crud.loading.value
})

function onUpdateSelected(ids: number[]) {
  selection.setSelected(ids)
}

const isTagEntity = computed(() => {
  const key = (props.entity || '').toLowerCase()
  if (key === 'tag') return true
  return resourcePath.value.includes('/tag')
})

const canFeedback = (_entity: unknown) => true
const canTags = (_entity: unknown) => allowTags.value && !isTagEntity.value

function handleFullEdit(row: EntityRow) {
  const raw = (row.raw ?? row) as Record<string, unknown>
  const id = Number(row.id ?? raw?.id)
  if (!Number.isFinite(id) || id <= 0) return
  emit('full-edit', id)
}

const emptyTitle = computed(() => t('common.noResults'))
const emptySubtitle = computed(() => t('common.tryAdjustFilters'))
const emptyCreateLabel = computed(() => `${t('ui.actions.create')} ${props.label}`)
const emptyResetLabel = computed(() => t('common.resetFilters'))
</script>