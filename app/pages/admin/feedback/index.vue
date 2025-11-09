<!-- app/pages/admin/feedback/index.vue -->
<template>
  <div class="px-4">
    <UCard>
      <template #header>
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {{ tt('features.admin.feedbackTitle', 'Feedback') }}
              <UBadge color="primary" variant="soft">{{ openCount }} open</UBadge>
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ tt('features.admin.feedbackSubtitle', 'Review and manage card feedback') }}</p>
          </div>
          <div class="flex gap-2">
            <UButton icon="i-heroicons-arrow-path" color="neutral" variant="soft" :label="tt('ui.actions.refresh', 'Refresh')" @click="reload" />
          </div>
        </div>
      </template>

      <!-- Dashboard -->
      <FeedbackDashboard class="mb-4" :query="{ status: status, type: type }" />

      <div class="flex flex-wrap items-center gap-2 mb-3">
        <UInput v-model="search" :placeholder="tt('ui.actions.search', 'Search')" icon="i-heroicons-magnifying-glass" class="w-full sm:w-72" />
        <USelectMenu v-model="status" :items="statusOptions" value-key="value" option-attribute="label" class="w-40" />
        <USwitch v-model="mineOnly" :label="tt('features.admin.feedback.filters.mineOnly','My feedbacks')" size="sm" />
      </div>

      <!-- Type tabs -->
      <div class="mb-3">
        <UTabs v-model="type" :items="feedbackTabs" />
      </div>

      <div v-if="error" class="mb-3">
        <UAlert color="error" :title="tt('ui.notifications.error', 'Error')" :description="String(error)" />
      </div>

      <div v-if="pending" class="py-6">
        <USkeleton class="h-8 w-full mb-2" />
        <USkeleton class="h-8 w-full" />
      </div>
      <div v-else>
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-500">{{ tt('ui.table.selectedCount','{n} selected').replace('{n}', String(selectedIds.length)) }}</div>
          <div class="flex gap-2">
            <UButton
              size="sm"
              color="primary"
              :disabled="!isEditor || selectedIds.length===0"
              :title="!isEditor ? tt('ui.messages.noPermission','No permission') : tt('feedback.resolveSelected','Resolve selected')"
              @click="openResolveConfirm"
            >{{ tt('feedback.resolveSelected','Resolve selected') }}</UButton>
            <UButton
              size="sm"
              color="primary"
              variant="soft"
              icon="i-heroicons-arrow-path"
              :disabled="selectedIds.length===0"
              @click="bulkReopen"
            >{{ tt('admin.feedback.actions.reopenSelected', 'Reopen selected') }}</UButton>
            <UButton
              size="sm"
              color="error"
              variant="soft"
              icon="i-heroicons-trash"
              :disabled="selectedIds.length===0"
              @click="bulkDelete"
            >{{ tt('admin.feedback.actions.deleteSelected', 'Delete selected') }}</UButton>
          </div>
        </div>
        <FeedbackList
          v-model:selected="selectedIds"
          :items="filtered"
          :is-editor="isEditor"
          @view="onView"
          @view-json="onViewJson"
          @resolve="onResolve"
          @reopen="onReopen"
          @delete="onDelete"
          @notes="onNotes"
        />
      </div>

      <!-- Preview Modal -->
      <UModal v-model:open="previewOpen" :title="tt('ui.actions.preview', 'Preview')">
        <template #body>
          <div class="min-h-20">
            <div v-if="previewLoading" class="py-8 text-center text-gray-500">{{ tt('ui.states.loading', 'Loading...') }}</div>
            <div v-else-if="previewCard">
              <CartaRow
                :template-key="'Class'"
                :type-label="previewCard.card_type_name || previewCard.card_type_code || ''"
                :name="previewCard.name || previewCard.code"
                :short-text="previewCard.short_text || ''"
                :description="previewCard.description || ''"
                :img="previewCard.image || undefined"
              />
            </div>
            <div v-else class="py-8 text-center text-gray-500">{{ tt('features.feedback.noLinkedCard', 'No linked card preview') }}</div>
          </div>
        </template>
      </UModal>

      <PaginationControls
        class="mt-4"
        :page="meta.page"
        :page-size="meta.pageSize"
        :total-items="meta.totalItems"
        :total-pages="meta.totalPages"
        :has-server-pagination="true"
        :page-size-items="pageSizeItems"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </UCard>
    <JsonModal v-model="jsonOpen" :value="jsonData" :title="tt('feedback.viewJson','Linked entity JSON')" />

    <!-- Notes Modal -->
    <FeedbackNotesModal
      :open="notesOpen"
      :detail="notesItem?.detail || ''"
      :is-editor="isEditor"
      :username="currentUser?.username || currentUser?.name || ''"
      @update:open="v => notesOpen = v"
      @save="saveNotes"
    />

    <!-- Resolve Confirm Modal -->
    <UModal v-model:open="resolveOpen" :title="tt('features.admin.feedback.actions.confirmResolve','Confirm resolve')">
      <template #body>
        <p class="text-sm text-gray-600 dark:text-gray-300">{{ tt('features.admin.feedback.actions.confirmResolve','Confirm resolve') }} — {{ tt('ui.table.selectedCount','{n} selected').replace('{n}', String(selectedIds.length)) }}</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="soft" @click="resolveOpen=false">{{ tt('ui.actions.cancel','Cancel') }}</UButton>
          <UButton color="primary" :disabled="resolving" @click="confirmResolveSelected">{{ tt('feedback.resolveSelected','Resolve selected') }}</UButton>
        </div>
      </template>
    </UModal>

    <!-- Global Delete Modal -->
    <ConfirmDeleteModal
      :open="deleteOpen"
      :title="tt('features.admin.feedbackDeleteTitle', 'Delete feedback')"
      :description="tt('features.admin.feedbackDeleteDescription', 'This will permanently delete this feedback entry. This action cannot be undone.')"
      :confirm-label="tt('ui.dialogs.confirm.deleteConfirm', 'Delete')"
      :cancel-label="tt('ui.actions.cancel', 'Cancel')"
      :loading="deleting"
      @update:open="v => deleteOpen.value = v"
      @confirm="confirmDelete"
      @cancel="() => { deleteOpen.value = false; toDelete.value = null }"
    />
  </div>
</template>

<script setup lang="ts">
import FeedbackList from '@/components/admin/FeedbackList.vue'
import CartaRow from '@/components/manage/CartaRow.vue'
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal.vue'
import JsonModal from '@/components/admin/JsonModal.vue'
import FeedbackNotesModal from '@/components/admin/FeedbackNotesModal.vue'
import FeedbackDashboard from '@/components/admin/FeedbackDashboard.vue'
import PaginationControls from '@/components/common/PaginationControls.vue'
import { useContentFeedback } from '@/composables/admin/useContentFeedback'
import { useCurrentUser } from '@/composables/users/useCurrentUser'
import { useApiFetch } from '@/utils/fetcher'
import { useDebounceFn } from '@vueuse/core'

const { t, te } = useI18n()
function tt(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}

useSeoMeta({ title: `${t('navigation.menu.admin') || 'Admin'} · ${tt('features.admin.feedbackTitle', 'Feedback')}` })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const apiFetch = useApiFetch

const search = ref('')
const status = ref<'all' | 'open' | 'resolved'>('all')
const type = ref<'all' | 'bug' | 'suggestion' | 'balance'>('all')
const mineOnly = ref(false)

const counts = ref<{ bug: number; suggestion: number; balance: number }>({ bug: 0, suggestion: 0, balance: 0 })
const feedbackTabs = computed(() => [
  { label: tt('admin.feedback.tabs.all', 'All'), value: 'all' },
  { label: `${tt('admin.feedback.tabs.bug', 'Bugs')} (${counts.value.bug})`, value: 'bug' },
  { label: `${tt('admin.feedback.tabs.suggestion', 'Suggestions')} (${counts.value.suggestion})`, value: 'suggestion' },
  { label: `${tt('admin.feedback.tabs.balance', 'Balance')} (${counts.value.balance})`, value: 'balance' },
  { label: `${tt('admin.feedback.tabs.translation', 'Translation')} (${counts.value.balance})`, value: 'translation' },
])

const statusOptions = [
  { label: tt('ui.filters.all', 'All'), value: 'all' },
  { label: tt('system.status.open', 'Open'), value: 'open' },
  { label: tt('system.status.resolved', 'Resolved'), value: 'resolved' },
]

const {
  items,
  pending,
  error,
  meta,
  fetchList,
  fetchMeta,
  resolve,
  reopen,
  remove,
  update,
} = useContentFeedback()

const { currentUser } = useCurrentUser()
const currentUserId = computed(() => currentUser.value?.id)
const isEditor = computed(() => {
  const roles = currentUser.value?.roles?.map(role => role.name) || []
  return roles.includes('admin') || roles.includes('editor')
})

const filters = computed(() => ({
  search: search.value || undefined,
  status: status.value !== 'all' ? status.value : undefined,
  category: type.value !== 'all' ? type.value : undefined,
  created_by: mineOnly.value ? currentUserId.value : undefined,
}))

const dashboardQuery = computed(() => ({
  status: filters.value.status ?? null,
  type: filters.value.category ?? null,
}))

const pagination = reactive({ page: 1, pageSize: 20 })
const pageSizeItems = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
]

const pageForUi = computed(() => meta.value?.page ?? pagination.page)
const pageSizeForUi = computed(() => meta.value?.pageSize ?? pagination.pageSize)
const totalItemsForUi = computed(() => meta.value?.totalItems ?? (items.value?.length ?? 0))
const totalPagesForUi = computed(() => {
  if (meta.value?.totalPages != null) return meta.value.totalPages
  const size = Math.max(1, pageSizeForUi.value)
  return Math.max(1, Math.ceil((totalItemsForUi.value || 0) / size))
})

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return items.value || []
  return (items.value || []).filter(entry =>
    entry.card_code?.toLowerCase().includes(term)
    || entry.title?.toLowerCase().includes(term)
    || entry.comment?.toLowerCase().includes(term),
  )
})

const openCount = computed(() => (items.value || []).filter(item => item.status !== 'resolved').length)

const selectedIds = ref<number[]>([])
const previewOpen = ref(false)
const previewLoading = ref(false)
const previewCard = ref<any>(null)
const jsonOpen = ref(false)
const jsonData = ref<any>(null)
const notesOpen = ref(false)
const notesItem = ref<any | null>(null)
const toDelete = ref<any | null>(null)
const deleteOpen = ref(false)
const deleting = ref(false)
const resolveOpen = ref(false)
const resolving = ref(false)

function pushQuery() {
  router.replace({
    query: {
      ...route.query,
      search: search.value || undefined,
      status: status.value !== 'all' ? status.value : undefined,
      type: type.value !== 'all' ? type.value : undefined,
      mineOnly: mineOnly.value ? 'true' : undefined,
      page: pagination.page > 1 ? String(pagination.page) : undefined,
      pageSize: pagination.pageSize !== 20 ? String(pagination.pageSize) : undefined,
    },
  })
}

async function loadList(overrides: { page?: number; pageSize?: number } = {}) {
  const query = {
    ...filters.value,
    page: overrides.page ?? pagination.page,
    pageSize: overrides.pageSize ?? pagination.pageSize,
  }
  await fetchList(query)
  pagination.page = meta.value?.page ?? query.page ?? 1
  pagination.pageSize = meta.value?.pageSize ?? query.pageSize ?? pagination.pageSize
  selectedIds.value = []
}

async function reload() {
  await loadList()
  await fetchCountsByType()
  pushQuery()
}

const debouncedFilters = useDebounceFn(async () => {
  pagination.page = 1
  await loadList({ page: 1 })
  await fetchCountsByType()
  pushQuery()
}, 200)

const initialized = ref(false)
watch(filters, () => {
  if (!initialized.value) return
  debouncedFilters()
}, { deep: true })

function applyInitialQuery() {
  const q = route.query
  if (typeof q.search === 'string') search.value = q.search
  if (q.status === 'open' || q.status === 'resolved') status.value = q.status
  if (q.type === 'bug' || q.type === 'suggestion' || q.type === 'balance') type.value = q.type
  if (q.mineOnly === 'true') mineOnly.value = true
  if (typeof q.page === 'string' && !Number.isNaN(Number(q.page))) pagination.page = Math.max(1, Number(q.page))
  if (typeof q.pageSize === 'string') {
    const size = Number(q.pageSize)
    if ([10, 20, 50].includes(size)) pagination.pageSize = size
  }
}

onMounted(async () => {
  applyInitialQuery()
  await loadList()
  await fetchCountsByType()
  pushQuery()
  initialized.value = true
})

const entityPreviewMap: Record<string, string> = {
  base_card_translations: '/base_card',
  base_card_translation: '/base_card',
  arcana_translation: '/arcana',
  arcana_translations: '/arcana',
  facet_translation: '/facet',
  facet_translations: '/facet',
  world_translations: '/world',
  world_translation: '/world',
  base_skills_translations: '/skills',
  base_card_type_translations: '/card_type',
}

async function fetchEntitySnapshot(entityType: string, entityId: number, lang?: string | null) {
  const endpoint = entityPreviewMap[entityType]
  if (!endpoint) return null
  try {
    const response = await apiFetch<{ success?: boolean; data: any }>(`${endpoint}/${entityId}`, {
      method: 'GET',
      params: lang ? { lang } : undefined,
    })
    return response?.data ?? response ?? null
  } catch {
    return null
  }
}

async function onView(f: any) {
  previewOpen.value = true
  previewLoading.value = true
  previewCard.value = null
  try {
    const id = Number(f.entity_id)
    const entityType = String(f.entity_type || '')
    const lang = f.language_code || undefined
    if (!Number.isFinite(id)) return
    previewCard.value = await fetchEntitySnapshot(entityType, id, lang)
  } finally {
    previewLoading.value = false
  }
}

async function onViewJson(f: any) {
  const id = Number(f.entity_id)
  const entityType = String(f.entity_type || '')
  const lang = f.language_code || undefined
  if (!Number.isFinite(id)) return
  const data = await fetchEntitySnapshot(entityType, id, lang)
  if (data) {
    jsonData.value = data
    jsonOpen.value = true
  }
}

async function onResolve(f: any) {
  try {
    await resolve(f.id)
    toast.add({ title: tt('ui.notifications.success', 'Success'), description: tt('features.admin.feedback.resolvedOk', 'Resolved successfully'), color: 'success' })
    await reload()
  } catch (err) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: tt('features.admin.feedback.resolvedErr', 'Error resolving feedback'), color: 'error' })
  }
}

async function onReopen(f: any) {
  try {
    await reopen(f.id)
    toast.add({ title: tt('features.admin.feedback.actions.reopen', 'Reopen'), color: 'success' })
    await reload()
  } catch (err) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: tt('admin.feedback.reopenError', 'Error reopening feedback'), color: 'error' })
  }
}

function onDelete(f: any) {
  toDelete.value = f
  deleteOpen.value = true
}

function onNotes(f: any) {
  notesItem.value = f
  notesOpen.value = true
}

async function saveNotes(nextDetail: string) {
  if (!notesItem.value) return
  try {
    await update(notesItem.value.id, { detail: nextDetail })
    toast.add({ title: tt('ui.notifications.success', 'Success'), description: tt('features.feedback.saved', 'Feedback saved'), color: 'success' })
    notesOpen.value = false
    notesItem.value = null
    await loadList()
  } catch (err: any) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: String(err?.data?.message ?? err?.message ?? err), color: 'error' })
  }
}

function openResolveConfirm() {
  if (isEditor.value && selectedIds.value.length > 0) resolveOpen.value = true
}

async function confirmResolveSelected() {
  if (!isEditor.value || selectedIds.value.length === 0) return
  try {
    resolving.value = true
    const results = await Promise.allSettled(selectedIds.value.map(id => resolve(id)))
    const allOk = results.every(result => result.status === 'fulfilled')
    toast.add({
      title: allOk ? tt('ui.notifications.success', 'Success') : tt('common.partial', 'Partial'),
      description: allOk ? tt('features.admin.feedback.resolvedOk', 'Resolved successfully') : tt('features.admin.feedback.resolvedPartial', 'Some items failed'),
      color: allOk ? 'success' : 'warning',
    })
    selectedIds.value = []
    resolveOpen.value = false
    await reload()
  } catch (err) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: tt('features.admin.feedback.resolvedErr', 'Error resolving feedback'), color: 'error' })
  } finally {
    resolving.value = false
  }
}

async function confirmDelete() {
  if (!toDelete.value) return
  try {
    deleting.value = true
    await remove(toDelete.value.id)
    toast.add({ title: tt('ui.notifications.success', 'Success'), description: tt('ui.notifications.deleteSuccess', 'Deleted successfully'), color: 'success' })
    deleteOpen.value = false
    toDelete.value = null
    await reload()
  } finally {
    deleting.value = false
  }
}

async function fetchCountsByType() {
  const types = ['bug', 'suggestion', 'balance'] as const
  try {
    const baseFilters: Record<string, any> = {
      search: filters.value.search,
      status: filters.value.status,
      created_by: filters.value.created_by,
    }
    const [bug, suggestion, balance] = await Promise.all(
      types.map(t => fetchMeta({ ...baseFilters, category: t, page: 1, pageSize: 1 })),
    )
    counts.value = {
      bug: bug?.totalItems ?? 0,
      suggestion: suggestion?.totalItems ?? 0,
      balance: balance?.totalItems ?? 0,
    }
  } catch {
    counts.value = { bug: 0, suggestion: 0, balance: 0 }
  }
}

function handlePageChange(next: number) {
  pagination.page = next
  loadList({ page: next })
  pushQuery()
}

function handlePageSizeChange(next: number) {
  pagination.pageSize = next
  pagination.page = 1
  loadList({ page: 1, pageSize: next })
  pushQuery()
}

async function bulkReopen() {
  if (selectedIds.value.length === 0) return
  try {
    await Promise.all(selectedIds.value.map(id => reopen(id)))
    toast.add({ title: tt('admin.feedback.actions.reopenSelected', 'Reopen selected'), color: 'success' })
    selectedIds.value = []
    await reload()
  } catch (err) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: tt('admin.feedback.reopenError', 'Error reopening feedback'), color: 'error' })
  }
}

async function bulkDelete() {
  if (selectedIds.value.length === 0) return
  if (typeof window !== 'undefined' && !window.confirm(tt('admin.feedback.confirmDelete', 'Delete selected feedback?'))) return
  try {
    await Promise.all(selectedIds.value.map(id => remove(id)))
    toast.add({ title: tt('ui.notifications.deleteSuccess', 'Deleted successfully'), color: 'success' })
    selectedIds.value = []
    await reload()
  } catch (err) {
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: tt('admin.feedback.deleteError', 'Error deleting feedback'), color: 'error' })
  }
}
</script>
