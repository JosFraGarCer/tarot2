<!-- app/components/admin/RevisionsTable.vue -->
<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <UInput v-model="search" :placeholder="$t('ui.actions.search','Search')" icon="i-heroicons-magnifying-glass" class="w-full sm:w-72" />
      <USelectMenu v-model="entityType" :items="entityTypeItems" value-key="value" option-attribute="label" class="w-64" />
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600 dark:text-gray-300">{{ $t('ui.fields.status','Status') }}</span>
        <USelectMenu v-model="status" :items="statusItems" value-key="value" option-attribute="label" class="w-40" />
      </div>
      <div class="ml-auto flex gap-2">
        <UButton size="xs" variant="soft" color="neutral" :disabled="pending" @click="reload">{{ $t('ui.actions.refresh','Refresh') }}</UButton>
        <UButton size="xs" :disabled="!isEditor || !hasSelectedItems" :title="!isEditor ? $t('ui.messages.noPermission') : ''" @click="bulkApprove">{{ $t('features.admin.revisions.approveSelected','Approve selected') }}</UButton>
        <UButton size="xs" color="error" variant="soft" :disabled="!isEditor || !hasSelectedItems" :title="!isEditor ? $t('ui.messages.noPermission') : ''" @click="bulkReject">{{ $t('features.admin.revisions.rejectSelected','Reject selected') }}</UButton>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th class="py-2 pr-2"><UCheckbox :model-value="allChecked" :indeterminate="indeterminate" @update:model-value="val => toggleAll(val)" /></th>
            <th class="py-2 pr-4">{{ $t('ui.fields.entity','Entity') }}</th>
            <th class="py-2 pr-4">{{ $t('ui.fields.language','Language') }}</th>
            <th class="py-2 pr-4">{{ $t('ui.fields.status','Status') }}</th>
            <th class="py-2 pr-4">{{ $t('ui.misc.createdAt','Created') }}</th>
            <th class="py-2 pr-4 text-right">{{ $t('ui.table.actions','Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in items" :key="r.id" class="border-b border-gray-100 dark:border-gray-800">
            <td class="py-2 pr-2"><UCheckbox :model-value="isSelected(r.id)" @update:model-value="v => toggleOne(r.id, v)" /></td>
            <td class="py-2 pr-4 text-xs">{{ r.entity_type }}#{{ r.entity_id }}</td>
            <td class="py-2 pr-4">{{ r.language_code || '—' }}</td>
            <td class="py-2 pr-4"><UBadge variant="soft">{{ r.status }}</UBadge></td>
            <td class="py-2 pr-4">{{ formatDate(r.created_at) }}</td>
            <td class="py-2 pr-0">
              <div class="flex justify-end gap-2">
                <UButton size="xs" icon="i-heroicons-document-magnifying-glass" variant="soft" :title="$t('features.admin.revisions.viewDiff','View diff')" @click="onViewDiff(r)" />
                <UButton size="xs" icon="i-heroicons-check-circle" color="primary" variant="soft" :disabled="!isEditor" :title="!isEditor ? $t('ui.messages.noPermission') : $t('system.status.approved','Approve')" @click="setOne(r.id, 'approved')" />
                <UButton size="xs" icon="i-heroicons-x-circle" color="error" variant="soft" :disabled="!isEditor" :title="!isEditor ? $t('ui.messages.noPermission') : $t('system.status.draft','Reject')" @click="setOne(r.id, 'rejected')" />
              </div>
            </td>
          </tr>
          <tr v-if="!items || items.length===0">
            <td colspan="6" class="py-6 text-center text-gray-400">{{ $t('ui.empty.noData','No data') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

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
import { useRevisions } from '@/composables/admin/useRevisions'
import JsonModal from '@/components/admin/JsonModal.vue'
import { formatDate } from '@/utils/date'
import { useCurrentUser } from '@/composables/users/useCurrentUser'
import PaginationControls from '@/components/common/PaginationControls.vue'
import { useDebounceFn } from '@vueuse/core'
import { useTableSelection } from '@/composables/common/useTableSelection'

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
  error,
  meta,
  fetchList,
  fetchOne,
  setStatus,
  bulkSetStatus,
  lastQuery,
} = useRevisions()
const { currentUser } = useCurrentUser()
const isEditor = computed(() => {
  const roles = currentUser.value?.roles?.map(r => r.name) || []
  return roles.includes('admin') || roles.includes('editor')
})

const selection = useTableSelection(() => items.value.map(r => r.id))
const selectedIds = selection.selectedList
const hasSelectedItems = computed(() => selectedIds.value.length > 0)
const allChecked = selection.isAllSelected
const indeterminate = selection.isIndeterminate

const isSelected = selection.isSelected
function toggleOne(id:number, value:boolean) {
  selection.toggleOne(id, value)
}
function toggleAll(value?: boolean) {
  selection.toggleAll(value)
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
const currentDiff = ref<any>({})
function onViewDiff(r:any) {
  currentDiff.value = r?.diff || {}
  diffOpen.value = true
}

// Status filter state and options
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

function handlePageChange(next: number) {
  pagination.page = next
  reload({ page: next })
}

function handlePageSizeChange(next: number) {
  pagination.pageSize = next
  pagination.page = 1
  reload({ page: 1, pageSize: next })
}
</script>
