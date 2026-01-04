<!-- app/components/admin/RevisionsTable.vue -->
<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <UInput
        v-model="search"
        :placeholder="$t('ui.actions.search','Search')"
        icon="i-heroicons-magnifying-glass"
        class="w-full sm:w-72"
      />
      <USelectMenu
        v-model="entityType"
        :items="entityTypeItems"
        value-key="value"
        option-attribute="label"
        class="w-64"
      />
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600 dark:text-gray-300">{{ $t('ui.fields.status','Status') }}</span>
        <USelectMenu
          v-model="status"
          :items="statusItems"
          value-key="value"
          option-attribute="label"
          class="w-40"
        />
      </div>
      <div class="ml-auto flex gap-2">
        <UButton
          size="xs"
          variant="soft"
          color="neutral"
          :disabled="pending"
          @click="reload"
        >
          {{ $t('ui.actions.refresh','Refresh') }}
        </UButton>
        <UButton
          size="xs"
          :disabled="!isEditor || !hasSelectedItems"
          :title="!isEditor ? $t('ui.messages.noPermission') : ''"
          @click="bulkApprove"
        >
          {{ $t('features.admin.revisions.approveSelected','Approve selected') }}
        </UButton>
        <UButton
          size="xs"
          color="error"
          variant="soft"
          :disabled="!isEditor || !hasSelectedItems"
          :title="!isEditor ? $t('ui.messages.noPermission') : ''"
          @click="bulkReject"
        >
          {{ $t('features.admin.revisions.rejectSelected','Reject selected') }}
        </UButton>
      </div>
    </div>

    <AdminTableBridge
      ref="bridgeRef"
      :items="rows"
      :columns="columns"
      :meta="meta"
      :loading="pending"
      :selection="selectionAdapter"
      entity-kind="revision"
      :density-toggle="false"
      :show-toolbar="false"
      @update:selected="onSelectedUpdate"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    >
      <template #bulk-actions="{ selected }">
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            size="xs"
            :disabled="!isEditor || !selected.length"
            @click="bulkApprove"
          >
            {{ $t('features.admin.revisions.approveSelected','Approve selected') }}
          </UButton>
          <UButton
            size="xs"
            color="error"
            variant="soft"
            :disabled="!isEditor || !selected.length"
            @click="bulkReject"
          >
            {{ $t('features.admin.revisions.rejectSelected','Reject selected') }}
          </UButton>
        </div>
      </template>

      <template #cell-code="{ row }">
        <span class="font-mono text-xs text-neutral-600 dark:text-neutral-300">
          {{ renderEntityIdentifier(row) }}
        </span>
      </template>

      <template #cell-name="{ row }">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-neutral-50">
            <span class="truncate">{{ row.name }}</span>
            <UBadge v-if="row.lang" size="xs" color="primary" variant="soft">
              {{ String(row.lang).toUpperCase() }}
            </UBadge>
          </div>
          <p v-if="row.short_text" class="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
            {{ row.short_text }}
          </p>
        </div>
      </template>

      <template #cell-status="{ row }">
        <UBadge variant="soft">
          {{ row.status || $t('ui.states.unknown','Unknown') }}
        </UBadge>
      </template>

      <template #cell-version="{ row }">
        <span class="text-xs text-neutral-500 dark:text-neutral-400">
          {{ row.version != null ? `v${row.version}` : '—' }}
        </span>
      </template>

      <template #cell-created_at="{ row }">
        <span class="text-xs text-neutral-500 dark:text-neutral-400">
          {{ formatDate(row.created_at) }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex justify-end gap-2">
          <UButton
            size="xs"
            icon="i-heroicons-document-magnifying-glass"
            variant="soft"
            :title="$t('features.admin.revisions.viewDiff','View diff')"
            @click="onViewDiff(row.raw)
            "
          />
          <UButton
            size="xs"
            icon="i-heroicons-eye"
            variant="soft"
            :title="$t('ui.actions.preview','Preview')"
            @click="openPreview(row)"
          />
          <UButton
            size="xs"
            icon="i-heroicons-check-circle"
            color="primary"
            variant="soft"
            :disabled="!isEditor"
            :title="!isEditor ? $t('ui.messages.noPermission') : $t('system.status.approved','Approve')"
            @click="setOne(Number(row.id), 'approved')"
          />
          <UButton
            size="xs"
            icon="i-heroicons-x-circle"
            color="error"
            variant="soft"
            :disabled="!isEditor"
            :title="!isEditor ? $t('ui.messages.noPermission') : $t('system.status.draft','Reject')"
            @click="setOne(Number(row.id), 'rejected')"
          />
        </div>
      </template>
    </AdminTableBridge>

    <PaginationControls
      class="pt-2"
      :page="pageForUi"
      :page-size="pageSizeForUi"
      :total-items="totalItemsForUi"
      :total-pages="totalPagesForUi"
      :has-server-pagination="true"
      :page-size-items="pageSizeItems"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />

    <JsonModal v-model="diffOpen" :value="currentDiff" :title="$t('features.admin.revisions.diffTitle','Revision diff')" />
  </div>
</template>

<script setup lang="ts">
import { useRevisions } from '~/composables/admin/useRevisions'
import JsonModal from '~/components/admin/JsonModal.vue'
import { formatDate } from '~/utils/date'
import { useCurrentUser } from '~/composables/users/useCurrentUser'
import PaginationControls from '~/components/common/PaginationControls.vue'
import { useDebounceFn } from '@vueuse/core'
import { useTableSelection } from '~/composables/common/useTableSelection'
import AdminTableBridge from '~/components/admin/AdminTableBridge.vue'
import type { ColumnDefinition } from '~/components/common/CommonDataTable.vue'
import type { EntityRow } from '~/components/manage/view/EntityTable.vue'
import { mapRevisionsToRows } from '~/utils/manage/entityRows'

const { t } = useI18n()

const props = withDefaults(defineProps<{ defaultStatus?: 'draft'|'approved'|'rejected'|'published' }>(), { defaultStatus: 'approved' })

const search = ref('')
const entityType = ref<string | null>(null)
const entityTypeItems = [
  { label: t('ui.filters.all','All'), value: null },
  { label: 'arcana_translation', value: 'arcana_translation' },
  { label: 'base_card_translations', value: 'base_card_translations' },
  { label: 'base_skills_translations', value: 'base_skills_translations' },
  { label: 'facet_translation', value: 'facet_translation' },
  { label: 'world_translations', value: 'world_translations' }
]

const {
  items,
  pending,
  meta,
  fetchList,
  setStatus,
  bulkSetStatus,
  lastQuery,
} = useRevisions()
const { currentUser } = useCurrentUser()
const isEditor = computed(() => {
  const roles = currentUser.value?.roles?.map(r => r.name) || []
  return roles.includes('admin') || roles.includes('editor')
})

const rows = computed<EntityRow[]>(() => mapRevisionsToRows(items.value))

const columns = computed<ColumnDefinition[]>(() => [
  { key: 'code', label: t('ui.fields.entity','Entity'), sortable: false, width: '16rem' },
  { key: 'category', label: t('ui.fields.type','Type'), sortable: false, width: '12rem' },
  { key: 'entity_id', label: t('ui.fields.id','Entity ID'), sortable: false, width: '8rem' },
  { key: 'name', label: t('ui.fields.name','Name'), sortable: false, width: '32%' },
  { key: 'status', label: t('ui.fields.status','Status'), sortable: false },
  { key: 'version', label: t('ui.fields.version','Version'), sortable: true, width: '6rem' },
  { key: 'created_at', label: t('ui.misc.createdAt','Created'), sortable: true, width: '12rem' },
  { key: 'actions', label: t('ui.table.actions','Actions'), sortable: false, width: '1%' },
])

const selection = useTableSelection(() => items.value.map(r => r.id))
const selectedIds = selection.selectedList
const hasSelectedItems = computed(() => selectedIds.value.length > 0)
const selectionAdapter = {
  selectedList: selection.selectedList,
  setSelected: (ids: Iterable<string | number>) => selection.setSelected(ids),
}

const pagination = reactive({ page: 1, pageSize: 20 })
const pageSizeItems = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
]

const pageForUi = computed(() => meta.value?.page ?? pagination.page)
const pageSizeForUi = computed(() => meta.value?.pageSize ?? pagination.pageSize)
const totalItemsForUi = computed(() => meta.value?.totalItems ?? items.value.length)
const totalPagesForUi = computed(() => {
  if (meta.value?.totalPages != null) return meta.value.totalPages
  return Math.max(1, Math.ceil(Math.max(0, totalItemsForUi.value) / Math.max(1, pageSizeForUi.value)))
})

const filters = computed(() => ({
  search: search.value || undefined,
  status: status.value,
  entity_type: entityType.value || undefined,
  page: pagination.page,
  pageSize: pagination.pageSize,
}))

async function reload(overrides: { page?: number; pageSize?: number } = {}) {
  const query = {
    ...filters.value,
    page: overrides.page ?? filters.value.page,
    pageSize: overrides.pageSize ?? filters.value.pageSize,
  }
  await fetchList(query)
  pagination.page = meta.value?.page ?? query.page ?? pagination.page
  pagination.pageSize = meta.value?.pageSize ?? query.pageSize ?? pagination.pageSize
}

async function setOne(id:number, status:'approved'|'rejected'|'draft'|'published') {
  if (!isEditor.value) return
  await setStatus(id, status)
  await reload()
}

async function bulkApprove() {
  if (!isEditor.value || selectedIds.value.length===0) return
  await bulkSetStatus(selectedIds.value, 'approved')
  selection.clear()
  await reload()
}
async function bulkReject() {
  if (!isEditor.value || selectedIds.value.length===0) return
  await bulkSetStatus(selectedIds.value, 'rejected')
  selection.clear()
  await reload()
}

const diffOpen = ref(false)
const currentDiff = ref<Record<string, unknown>>({})
function onViewDiff(r: Record<string, unknown> | null) {
  currentDiff.value = (r?.diff as Record<string, unknown>) || {}
  diffOpen.value = true
}

const status = ref<'draft'|'approved'|'rejected'|'published'>(props.defaultStatus)
const statusItems = [
  { label: 'Draft', value: 'draft' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Published', value: 'published' }
]

const applyFilters = useDebounceFn(async () => {
  pagination.page = 1
  await reload({ page: 1 })
}, 250)

watch([search, entityType], () => { applyFilters() })

watch(status, async () => {
  pagination.page = 1
  await reload({ page: 1 })
})

onMounted(async () => {
  if (lastQuery.value.pageSize) pagination.pageSize = lastQuery.value.pageSize
  await reload()
})

watch(() => meta.value?.page, (next) => {
  if (typeof next === 'number') pagination.page = next
})

watch(() => meta.value?.pageSize, (next) => {
  if (typeof next === 'number') pagination.pageSize = next
})

function handlePageChange(next: number) {
  pagination.page = next
  reload({ page: next })
}

function handlePageSizeChange(next: number) {
  pagination.pageSize = next
  pagination.page = 1
  reload({ page: 1, pageSize: next })
}

function onSelectedUpdate(ids: Array<string | number>) {
  selection.setSelected(ids)
}

const bridgeRef = ref<InstanceType<typeof AdminTableBridge> | null>(null)

function openPreview(row: EntityRow) {
  bridgeRef.value?.openPreview(row)
}

function renderEntityIdentifier(row: EntityRow) {
  if (row.code) return row.code
  if (row.raw?.entity_type && row.raw?.entity_id != null) return `${row.raw.entity_type}#${row.raw.entity_id}`
  return `#${row.id ?? '—'}`
}
</script>
