<!-- app/pages/admin/feedback/index.vue -->
<template>
  <div class="px-4">
    <UCard>
      <template #header>
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {{ tt('admin.feedbackTitle', 'Feedback') }}
              <UBadge color="primary" variant="soft">{{ openCount }} open</UBadge>
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ tt('admin.feedbackSubtitle', 'Review and manage card feedback') }}</p>
          </div>
          <div class="flex gap-2">
            <UButton icon="i-heroicons-arrow-path" color="neutral" variant="soft" :label="tt('common.refresh', 'Refresh')" @click="reload" />
          </div>
        </div>
      </template>

      <!-- Dashboard -->
      <FeedbackDashboard class="mb-4" :query="{ status: status, type: type }" />

      <div class="flex flex-wrap items-center gap-2 mb-3">
        <UInput v-model="search" :placeholder="tt('common.search', 'Search')" icon="i-heroicons-magnifying-glass" class="w-full sm:w-72" />
        <USelectMenu v-model="status" :items="statusOptions" value-key="value" option-attribute="label" class="w-40" />
        <USelectMenu v-model="type" :items="typeOptions" value-key="value" option-attribute="label" class="w-40" />
        <USwitch v-model="mineOnly" :label="tt('admin.feedback.filters.mineOnly','My feedbacks')" size="sm" />
      </div>

      <!-- Type tabs -->
      <div class="mb-3">
        <UTabs v-model="activeType" :items="feedbackTabs" />
      </div>

      <div v-if="error" class="mb-3">
        <UAlert color="error" :title="tt('common.error', 'Error')" :description="String(error)" />
      </div>

      <div v-if="pending" class="py-6">
        <USkeleton class="h-8 w-full mb-2" />
        <USkeleton class="h-8 w-full" />
      </div>
      <div v-else>
        <div class="flex items-center justify-between mb-2">
          <div class="text-sm text-gray-500">{{ tt('common.selectedCount','{n} selected').replace('{n}', String(selectedIds.length)) }}</div>
          <div class="flex gap-2">
            <UButton
              size="sm"
              color="primary"
              :disabled="!isEditor || selectedIds.length===0"
              :title="!isEditor ? tt('common.noPermission','No permission') : tt('feedback.resolveSelected','Resolve selected')"
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
      <UModal v-model:open="previewOpen" :title="tt('common.preview', 'Preview')">
        <template #body>
          <div class="min-h-20">
            <div v-if="previewLoading" class="py-8 text-center text-gray-500">{{ tt('common.loading', 'Loading...') }}</div>
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
            <div v-else class="py-8 text-center text-gray-500">{{ tt('feedback.noLinkedCard', 'No linked card preview') }}</div>
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
    <UModal v-model:open="resolveOpen" :title="tt('admin.feedback.actions.confirmResolve','Confirm resolve')">
      <template #body>
        <p class="text-sm text-gray-600 dark:text-gray-300">{{ tt('admin.feedback.actions.confirmResolve','Confirm resolve') }} — {{ tt('common.selectedCount','{n} selected').replace('{n}', String(selectedIds.length)) }}</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="soft" @click="resolveOpen=false">{{ tt('common.cancel','Cancel') }}</UButton>
          <UButton color="primary" :disabled="resolving" @click="confirmResolveSelected">{{ tt('feedback.resolveSelected','Resolve selected') }}</UButton>
        </div>
      </template>
    </UModal>

    <!-- Global Delete Modal -->
    <ConfirmDeleteModal
      :open="deleteOpen"
      :title="tt('admin.feedbackDeleteTitle', 'Delete feedback')"
      :description="tt('admin.feedbackDeleteDescription', 'This will permanently delete this feedback entry. This action cannot be undone.')"
      :confirm-label="tt('manageConfirm.deleteConfirm', 'Delete')"
      :cancel-label="tt('common.cancel', 'Cancel')"
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
import { useContentFeedback } from '@/composables/admin/useContentFeedback'
import { useDebounceFn } from '@vueuse/core'
import PaginationControls from '@/components/common/PaginationControls.vue'
import { useCurrentUser } from '@/composables/users/useCurrentUser'
import FeedbackDashboard from '@/components/admin/FeedbackDashboard.vue'

const { t, te } = useI18n()
function tt(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}
useSeoMeta({ title: `${t('nav.admin') || 'Admin'} · ${tt('admin.feedbackTitle', 'Feedback')}` })
// State
const search = ref('')
const status = ref<'all'|'open'|'resolved'>('all')
const type = ref<'all'|'bug'|'suggestion'|'balance'>('all')
const activeType = ref<'all'|'bug'|'suggestion'|'balance'>('all')
const mineOnly = ref(false)
const counts = ref<{ bug:number; suggestion:number; balance:number }>({ bug: 0, suggestion: 0, balance: 0 })
const feedbackTabs = computed(() => [
  { label: tt('admin.feedback.tabs.all', 'All'), value: 'all' },
  { label: `${tt('admin.feedback.tabs.bug', 'Bugs')} (${counts.value.bug})`, value: 'bug' },
  { label: `${tt('admin.feedback.tabs.suggestion', 'Suggestions')} (${counts.value.suggestion})`, value: 'suggestion' },
  { label: `${tt('admin.feedback.tabs.balance', 'Balance')} (${counts.value.balance})`, value: 'balance' }
])

const statusOptions = [
  { label: tt('filters.all', 'All'), value: 'all' },
  { label: tt('status.open', 'Open'), value: 'open' },
  { label: tt('status.resolved', 'Resolved'), value: 'resolved' }
]
const typeOptions = [
  { label: tt('feedback.allTypes', 'All types'), value: 'all' },
  { label: tt('feedback.bug', 'Bug'), value: 'bug' },
  { label: tt('feedback.suggestion', 'Suggestion'), value: 'suggestion' },
  { label: tt('feedback.balance', 'Balance'), value: 'balance' }
]

// Data
const { items, pending, error, meta, fetchList, resolve, remove, update } = useContentFeedback()
const { currentUser } = useCurrentUser()
const isEditor = computed(() => {
  const roles = currentUser.value?.roles?.map(r => r.name) || []
  return roles.includes('admin') || roles.includes('editor')
})

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  return (items.value || []).filter(x =>
    (!term || x.card_code?.toLowerCase().includes(term) || x.title?.toLowerCase().includes(term))
  )
})

const openCount = computed(() => (items.value || []).filter(f => f.status !== 'resolved').length)

// Pagination state and options
const page = computed(() => meta.value?.page ?? 1)
const pageSize = computed(() => meta.value?.pageSize ?? 20)
const pageSizeItems = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 }
]

const route = useRoute()
const router = useRouter()

// Initialize filters from URL
onMounted(() => {
  const q = route.query
  if (typeof q.search === 'string') search.value = q.search
  if (q.status === 'open' || q.status === 'resolved' || q.status === 'all') status.value = q.status
  if (q.type === 'bug' || q.type === 'suggestion' || q.type === 'balance' || q.type === 'all') type.value = q.type
  if (q.mineOnly === 'true') mineOnly.value = true
  activeType.value = type.value
})

function pushQuery() {
  router.replace({ query: { ...route.query, search: search.value || undefined, status: status.value, type: type.value, mineOnly: mineOnly.value ? 'true' : undefined } })
}

const doFetch = useDebounceFn(() => {
  pushQuery()
  const created_by = mineOnly.value ? currentUser.value?.id : undefined
  return fetchList({ search: search.value, status: status.value, type: type.value, page: page.value, pageSize: pageSize.value, created_by })
}, 200)
watch([search, status, type, mineOnly], doFetch, { immediate: true })
watch(activeType, () => {
  type.value = activeType.value
  // reset to first page when switching type
  const created_by = mineOnly.value ? currentUser.value?.id : undefined
  fetchList({ search: search.value, status: status.value, type: type.value === 'all' ? 'all' : type.value, page: 1, pageSize: pageSize.value, created_by })
  pushQuery()
  fetchCountsByType()
})
function reload() {
  pushQuery()
  const created_by = mineOnly.value ? currentUser.value?.id : undefined
  fetchList({ search: search.value, status: status.value, type: type.value, page: page.value, pageSize: pageSize.value, created_by })
}
const previewOpen = ref(false)
const previewLoading = ref(false)
const previewCard = ref<any>(null)
const jsonOpen = ref(false)
const jsonData = ref<any>(null)
const selectedIds = ref<number[]>([])
const toDelete = ref<any | null>(null)
const deleteOpen = ref(false)
const deleting = ref(false)
let notesOpen = ref(false)
let notesItem = ref<any | null>(null)

async function onView(f: any) {
  previewOpen.value = true
  previewLoading.value = true
  previewCard.value = null
  try {
    const id = f.entity_id
    const type = f.entity_type
    const lang = f.language_code || 'en'
    if (!id || !type) {
      previewCard.value = null
    } else {
      let url: string | null = null
      switch (type) {
        case 'base_card_translations':
          url = `/api/base_card/${id}`
          break
        case 'arcana_translation':
          url = `/api/arcana/${id}`
          break
        case 'facet_translation':
          url = `/api/facet/${id}`
          break
        case 'world_translations':
          url = `/api/world/${id}`
          break
        case 'base_skills_translations':
          url = `/api/skills/${id}`
          break
        case 'base_card_type_translations':
          url = `/api/card_type/${id}`
          break
        case 'world_card_translations':
          url = null // no preview endpoint yet
          break
        default:
          url = null
      }
      if (url) {
        const res = await $fetch<{ success:boolean; data:any }>(`${url}?lang=${encodeURIComponent(lang)}`)
        previewCard.value = res?.data || null
      } else {
        previewCard.value = null
      }
    }
  } catch {
    previewCard.value = null
  } finally {
    previewLoading.value = false
  }
}
async function onViewJson(f:any) {
  try {
    jsonData.value = null
    const id = f.entity_id
    const type = f.entity_type
    const lang = f.language_code || 'en'
    let url: string | null = null
    switch (type) {
      case 'base_card_translations': url = `/api/base_card/${id}`; break
      case 'arcana_translation': url = `/api/arcana/${id}`; break
      case 'facet_translation': url = `/api/facet/${id}`; break
      case 'world_translations': url = `/api/world/${id}`; break
      case 'base_skills_translations': url = `/api/skills/${id}`; break
      case 'base_card_type_translations': url = `/api/card_type/${id}`; break
      default: url = null
    }
    if (url) {
      const res = await $fetch<{ success:boolean; data:any }>(`${url}?lang=${encodeURIComponent(lang)}`)
      jsonData.value = res?.data || null
      jsonOpen.value = true
    }
  } catch {
    jsonData.value = null
  }
}
async function onResolve(f:any) {
  try {
    await resolve(f.id)
    useToast().add({ title: tt('common.success','Success'), description: tt('admin.feedback.resolvedOk','Resolved successfully'), color: 'success' })
    await fetchCountsByType()
  } catch (e:any) {
    useToast().add({ title: tt('common.error','Error'), description: tt('admin.feedback.resolvedErr','Error resolving feedback'), color: 'error' })
  }
}
async function onReopen(f:any) {
  try {
    await $fetch(`/api/content_feedback/${f.id}`, { method: 'PATCH', body: { status: 'open' } })
    useToast().add({ title: tt('admin.feedback.actions.reopen', 'Reopen'), color: 'success' })
    reload()
    await fetchCountsByType()
  } catch (e) {
    useToast().add({ title: tt('common.error', 'Error'), description: tt('admin.feedback.reopenError', 'Error reopening feedback'), color: 'error' })
  }
}
async function onDelete(f:any) {
  toDelete.value = f
  deleteOpen.value = true
}

function onNotes(f:any) {
  notesItem.value = f
  notesOpen.value = true
}

async function saveNotes(nextDetail: string) {
  if (!notesItem.value) return
  try {
    await update(notesItem.value.id, { detail: nextDetail })
    useToast().add({ title: tt('common.success','Success'), description: tt('feedback.saved','Feedback saved'), color: 'success' })
    notesOpen.value = false
    notesItem.value = null
    reload()
  } catch (e) {
    useToast().add({ title: tt('common.error','Error'), description: String(e), color: 'error' })
  }
}

const resolveOpen = ref(false)
const resolving = ref(false)
function openResolveConfirm() { if (isEditor.value && selectedIds.value.length>0) resolveOpen.value = true }
async function confirmResolveSelected() {
  if (!isEditor.value || selectedIds.value.length===0) return
  try {
    resolving.value = true
    const results = await Promise.allSettled(selectedIds.value.map(id => resolve(id)))
    const allOk = results.every(r => r.status === 'fulfilled')
    useToast().add({ title: allOk ? tt('common.success','Success') : tt('common.partial','Partial'), description: allOk ? tt('admin.feedback.resolvedOk','Resolved successfully') : tt('admin.feedback.resolvedPartial','Some items failed'), color: allOk ? 'success' : 'warning' })
    selectedIds.value = []
    resolveOpen.value = false
    reload()
  } catch (e:any) {
    useToast().add({ title: tt('common.error','Error'), description: tt('admin.feedback.resolvedErr','Error resolving feedback'), color: 'error' })
  } finally {
    resolving.value = false
  }
}

async function confirmDelete() {
  if (!toDelete.value) return
  try {
    deleting.value = true
    await remove(toDelete.value.id)
    // optional toast
    const toast = useToast?.()
    toast?.add?.({ title: tt('common.success', 'Success'), description: tt('messages.deleteSuccess', 'Deleted successfully'), color: 'success' })
    deleteOpen.value = false
    toDelete.value = null
    reload()
  } finally {
    deleting.value = false
  }
}

// Fetch server-side counts per type (bug/suggestion/balance) using meta.totalItems
async function fetchCountsByType() {
  const types = ['bug','suggestion','balance'] as const
  try {
    const [bug, suggestion, balance] = await Promise.all(
      types.map(t => $fetch<any>('/api/content_feedback', {
        method: 'GET',
        query: {
          status: status.value !== 'all' ? status.value : undefined,
          category: t,
          page: 1,
          pageSize: 1,
          search: search.value || undefined,
          created_by: mineOnly.value ? currentUser.value?.id : undefined
        }
      }))
    )
    counts.value = {
      bug: bug?.meta?.totalItems ?? 0,
      suggestion: suggestion?.meta?.totalItems ?? 0,
      balance: balance?.meta?.totalItems ?? 0
    }
  } catch {
    counts.value = { bug: 0, suggestion: 0, balance: 0 }
  }
}

// Refresh counts when core filters change
watch([search, status], () => { fetchCountsByType() })

onMounted(() => { fetchCountsByType() })

function handlePageChange(next: number) {
  fetchList({ search: search.value, status: status.value, type: type.value, page: next, pageSize: pageSize.value })
}
function handlePageSizeChange(next: number) {
  fetchList({ search: search.value, status: status.value, type: type.value, page: 1, pageSize: next })
}
async function bulkReopen() {
  if (selectedIds.value.length === 0) return
  try {
    await Promise.all(selectedIds.value.map(id => $fetch(`/api/content_feedback/${id}`, { method: 'PATCH', body: { status: 'open' } })))
    useToast().add({ title: tt('admin.feedback.actions.reopenSelected', 'Reopen selected'), color: 'success' })
    selectedIds.value = []
    await fetchList({ search: search.value, status: status.value, type: type.value, page: page.value, pageSize: pageSize.value })
    await fetchCountsByType()
  } catch (e) {
    useToast().add({ title: tt('common.error', 'Error'), description: tt('admin.feedback.reopenError', 'Error reopening feedback'), color: 'error' })
  }
}

async function bulkDelete() {
  if (selectedIds.value.length === 0) return
  if (!confirm(tt('admin.feedback.confirmDelete', 'Delete selected feedback?'))) return
  try {
    await Promise.all(selectedIds.value.map(id => $fetch(`/api/content_feedback/${id}`, { method: 'DELETE' })))
    useToast().add({ title: tt('messages.deleteSuccess', 'Deleted successfully'), color: 'success' })
    selectedIds.value = []
    await fetchList({ search: search.value, status: status.value, type: type.value, page: page.value, pageSize: pageSize.value })
    await fetchCountsByType()
  } catch (e) {
    useToast().add({ title: tt('common.error', 'Error'), description: tt('admin.feedback.deleteError', 'Error deleting feedback'), color: 'error' })
  }
}
</script>
