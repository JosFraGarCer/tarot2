<!-- app/components/admin/FeedbackList.vue -->
<template>
  <AdminTableBridge
    ref="bridgeRef"
    :items="rows"
    :columns="columns"
    :selection="selectionAdapter"
    :loading="tableLoading"
    entity-kind="feedback"
    :show-toolbar="false"
    :density-toggle="false"
    @update:selected="onSelectedUpdate"
  >
    <template #bulk-actions="{ selected: selectedIdsSlot }">
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          size="xs"
          color="primary"
          :disabled="!isEditor || !selectedIdsSlot.length"
          @click="emit('bulk-resolve')"
        >
          {{ tt('feedback.resolveSelected', 'Resolve selected') }}
        </UButton>
        <UButton
          size="xs"
          color="primary"
          variant="soft"
          icon="i-heroicons-arrow-path"
          :disabled="!selectedIdsSlot.length"
          @click="emit('bulk-reopen')"
        >
          {{ tt('admin.feedback.actions.reopenSelected', 'Reopen selected') }}
        </UButton>
        <UButton
          size="xs"
          color="error"
          variant="soft"
          icon="i-heroicons-trash"
          :disabled="!selectedIdsSlot.length"
          @click="emit('bulk-delete')"
        >
          {{ tt('admin.feedback.actions.deleteSelected', 'Delete selected') }}
        </UButton>
      </div>
    </template>

    <template #cell-code="{ row }">
      <span class="font-mono text-xs text-neutral-600 dark:text-neutral-300">
        {{ renderEntity(resolveFeedback(row)) }}
      </span>
    </template>

    <template #cell-name="{ row }">
      <div :class="nameCellClass(resolveFeedback(row))">
        <div class="flex items-center gap-2">
          <UTooltip :text="createdByTooltip(resolveFeedback(row))">
            <UAvatar size="xs" :text="renderAvatarInitial(resolveFeedback(row))" />
          </UTooltip>
          <div class="flex flex-wrap items-center gap-2">
            <span class="flex items-center gap-1 font-medium text-neutral-800 dark:text-neutral-100">
              {{ renderTitle(resolveFeedback(row)) }}
              <UIcon
                v-if="isRecentlyCreated(resolveFeedback(row))"
                name="i-heroicons-sparkles"
                class="text-primary-400"
                :title="tt('features.admin.feedback.new', 'New feedback')"
              />
              <UIcon
                v-if="hasInternalNotes(resolveFeedback(row))"
                name="i-heroicons-chat-bubble-left-ellipsis"
                class="text-neutral-400"
                :title="tt('features.admin.feedback.notes.hasNotes', 'Has internal notes')"
              />
            </span>
            <UBadge
              v-if="resolveFeedback(row).language_code"
              variant="soft"
              color="primary"
              size="xs"
            >
              {{ String(resolveFeedback(row).language_code).toUpperCase() }}
            </UBadge>
          </div>
        </div>
        <p
          v-if="renderDetail(resolveFeedback(row))"
          class="mt-1 line-clamp-2 text-xs text-neutral-500 dark:text-neutral-400"
        >
          {{ renderDetail(resolveFeedback(row)) }}
        </p>
      </div>
    </template>

    <template #cell-category="{ row }">
      <UBadge variant="soft">
        {{ renderCategory(resolveFeedback(row)) }}
      </UBadge>
    </template>

    <template #cell-status="{ row }">
      <UBadge
        :color="resolveFeedback(row).status === 'resolved' ? 'green' : 'primary'"
        variant="soft"
      >
        {{ resolveFeedback(row).status }}
      </UBadge>
    </template>

    <template #cell-created_at="{ row }">
      <span class="text-xs text-neutral-500 dark:text-neutral-400">
        {{ formatDate(resolveFeedback(row).created_at) }}
      </span>
    </template>

    <template #cell-actions="{ row }">
      <div class="flex justify-end gap-2">
        <UButton
          size="xs"
          icon="i-heroicons-code-bracket-square"
          variant="soft"
          :title="tt('features.admin.feedback.viewJson', 'View JSON')"
          @click="emit('view-json', resolveFeedback(row))"
        />
        <UButton
          size="xs"
          icon="i-heroicons-eye"
          variant="soft"
          :title="tt('ui.actions.preview', 'Preview')"
          @click="handlePreview(resolveFeedback(row))"
        />
        <UButton
          size="xs"
          icon="i-heroicons-pencil-square"
          variant="soft"
          :disabled="!isEditor"
          :title="!isEditor ? tt('ui.messages.noPermission', 'No permission') : tt('features.admin.feedback.actions.viewNotes', 'View notes')"
          @click="emit('notes', resolveFeedback(row))"
        />
        <UButton
          v-if="hasLinkedEntity(resolveFeedback(row))"
          size="xs"
          icon="i-heroicons-link"
          variant="soft"
          :title="tt('features.admin.feedback.actions.openEntity', 'Open related entity')"
          @click="openEntity(resolveFeedback(row))"
        />
        <UButton
          v-if="isEditor && resolveFeedback(row).status === 'resolved'"
          size="xs"
          icon="i-heroicons-arrow-path"
          variant="soft"
          :title="tt('features.admin.feedback.actions.reopen', 'Reopen')"
          @click="emit('reopen', resolveFeedback(row))"
        />
        <UButton
          size="xs"
          icon="i-heroicons-check-circle"
          color="primary"
          variant="soft"
          :disabled="!isEditor || resolveFeedback(row).status === 'resolved'"
          :title="!isEditor ? tt('ui.messages.noPermission', 'No permission') : tt('ui.actions.resolve', 'Resolve')"
          @click="emit('resolve', resolveFeedback(row))"
        />
        <UButton
          size="xs"
          icon="i-heroicons-trash"
          color="error"
          variant="soft"
          :title="tt('ui.actions.delete', 'Delete')"
          @click="emit('delete', resolveFeedback(row))"
        />
      </div>
    </template>
  </AdminTableBridge>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from '#imports'
import { navigateTo } from '#app'
import AdminTableBridge from '~/components/admin/AdminTableBridge.vue'
import type { ColumnDefinition } from '~/components/common/CommonDataTable.vue'
import type { EntityRow } from '~/components/manage/view/EntityTable.vue'
import { mapFeedbackListToRows } from '~/utils/manage/entityRows'
import { useTableSelection } from '~/composables/common/useTableSelection'
import { formatDate } from '@/utils/date'

type FeedbackListItem = {
  id: number
  entity_type?: string | null
  entity_id?: number | null
  comment?: string | null
  detail?: string | null
  title?: string | null
  category?: string | null
  type?: string | null
  status: string
  created_at: string
  language_code?: string | null
  created_by_name?: string | null
  card_code?: string | null
}

const props = withDefaults(defineProps<{
  items?: FeedbackListItem[]
  isEditor?: boolean
  loading?: boolean
}>(), {
  items: () => [],
  isEditor: false,
  loading: false,
})

const emit = defineEmits<{
  (e: 'view-json' | 'view' | 'notes' | 'reopen' | 'resolve' | 'delete', payload: FeedbackListItem): void
  (e: 'bulk-resolve' | 'bulk-reopen' | 'bulk-delete'): void
}>()

const selected = defineModel<number[]>('selected', { default: [] })

const { t, te } = useI18n()

function tt(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}

const isEditor = computed(() => Boolean(props.isEditor))
const tableLoading = computed(() => Boolean(props.loading))

const rows = computed<EntityRow[]>(() => mapFeedbackListToRows(props.items))

const columns = computed<ColumnDefinition[]>(() => [
  { key: 'code', label: tt('features.admin.feedback.card', 'Card'), sortable: false, width: '10rem' },
  { key: 'name', label: tt('features.admin.feedback.title', 'Title'), sortable: false, width: '40%' },
  { key: 'category', label: tt('features.admin.feedback.category', 'Category'), sortable: false },
  { key: 'status', label: tt('features.admin.feedback.status', 'Status'), sortable: false },
  { key: 'created_at', label: tt('ui.misc.createdAt', 'Created'), sortable: true, width: '10rem' },
  { key: 'actions', label: tt('ui.table.actions', 'Actions'), sortable: false, width: '1%' },
])

const selection = useTableSelection(() => props.items.map(item => item.id))

const selectionAdapter = {
  selectedList: selection.selectedList,
  setSelected: (ids: Iterable<string | number>) => selection.setSelected(ids),
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function normalizeIds(ids: Iterable<string | number>): number[] {
  const result: number[] = []
  for (const id of ids) {
    const value = typeof id === 'number' ? id : Number(id)
    if (Number.isFinite(value)) result.push(Number(value))
  }
  return result
}

watch(selected, (ids) => {
  if (!ids) {
    selection.clear()
    return
  }
  if (!arraysEqual(ids, selection.selectedList.value)) {
    selection.setSelected(ids)
  }
}, { immediate: true })

watch(selection.selectedList, (ids) => {
  if (!arraysEqual(ids, selected.value)) {
    selected.value = [...ids]
  }
})

function onSelectedUpdate(ids: Array<string | number>) {
  const normalized = normalizeIds(ids)
  if (!arraysEqual(normalized, selection.selectedList.value)) {
    selection.setSelected(normalized)
  }
  if (!arraysEqual(normalized, selected.value)) {
    selected.value = normalized
  }
}

const bridgeRef = ref<InstanceType<typeof AdminTableBridge> | null>(null)

function resolveRow(row: unknown): EntityRow | null {
  if (!row) return null
  const r = row as { original?: EntityRow }
  if ('original' in r && r.original) return r.original
  return row as EntityRow
}

function resolveFeedback(row: unknown): FeedbackListItem {
  const entityRow = resolveRow(row)
  if (entityRow?.raw) return entityRow.raw as FeedbackListItem
  if (entityRow?.id != null) {
    const match = props.items.find(item => item.id === entityRow.id)
    if (match) return match
  }
  return {} as FeedbackListItem
}

function renderEntity(item: FeedbackListItem) {
  if (item.card_code && item.card_code.trim().length) return item.card_code
  const type = item.entity_type ? item.entity_type.replace(/_/g, ' ') : '—'
  if (item.entity_id != null) return `${type} #${item.entity_id}`
  return type
}

function renderTitle(item: FeedbackListItem) {
  if (item.title && item.title.trim().length) return item.title
  if (item.comment && item.comment.trim().length) {
    const trimmed = item.comment.trim()
    return trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed
  }
  return '—'
}

function renderCategory(item: FeedbackListItem) {
  return item.type || item.category || '—'
}

function renderDetail(item: FeedbackListItem) {
  if (item.detail && item.detail.trim().length) return item.detail.trim()
  if (item.comment && item.comment.trim().length) {
    const trimmed = item.comment.trim()
    return trimmed.length > 160 ? `${trimmed.slice(0, 160)}…` : trimmed
  }
  return ''
}

function renderAvatarInitial(item: FeedbackListItem) {
  const name = item.created_by_name || 'Unknown'
  return (name?.trim()?.[0] || '?').toUpperCase()
}

function createdByTooltip(item: FeedbackListItem) {
  const name = item.created_by_name || tt('ui.states.unknown', 'Unknown')
  return `${tt('features.admin.feedback.createdBy', 'Created by')}: ${name}`
}

function isRecentlyCreated(item: FeedbackListItem) {
  if (!item.created_at) return false
  const created = new Date(item.created_at).getTime()
  if (Number.isNaN(created)) return false
  const dayMs = 24 * 60 * 60 * 1000
  return Date.now() - created < dayMs
}

function hasInternalNotes(item: FeedbackListItem) {
  return Boolean(item.detail && item.detail.includes('--- ['))
}

function hasLinkedEntity(item: FeedbackListItem) {
  return Boolean(item.entity_type && item.entity_id)
}

function nameCellClass(item: FeedbackListItem) {
  return [
    'flex flex-col gap-1 rounded-md px-1 py-1 transition-colors',
    isRecentlyCreated(item)
      ? 'bg-primary-50/50 dark:bg-primary-900/30'
      : 'bg-transparent',
  ]
}

function handlePreview(item: FeedbackListItem) {
  const row = rows.value.find(entry => entry.raw?.id === item.id)
  if (row) {
    bridgeRef.value?.openPreview(row)
  }
}

function openEntity(item: FeedbackListItem) {
  if (item?.entity_type && item?.entity_id) {
    navigateTo(`/admin/versions/${item.entity_type}/${item.entity_id}`)
  }
}
</script>
