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
        <UButton
          variant="soft"
          color="neutral"
          icon="i-heroicons-funnel"
          :label="tt('features.admin.feedback.advancedFilters', 'Advanced filters')"
          @click="advancedOpen = !advancedOpen"
        />
      </div>

      <AdvancedFiltersPanel
        class="mb-4"
        :open="advancedOpen"
        :apply-label="tt('ui.actions.apply','Apply')"
        :reset-label="tt('ui.actions.reset','Reset')"
        @apply="applyAdvanced"
        @reset="resetAdvanced"
        @update:open="v => (advancedOpen = v)"
      >
        <template #trigger>
          <slot name="advanced-trigger">
            <UButton
              variant="soft"
              color="neutral"
              icon="i-heroicons-funnel"
              :label="tt('features.admin.feedback.advancedFilters', 'Advanced filters')"
              @click="advancedOpen = !advancedOpen"
            />
          </slot>
        </template>

        <div class="flex flex-wrap gap-4">
          <div class="flex flex-col gap-2 w-full sm:w-40">
            <span class="text-xs uppercase tracking-wide text-gray-500">{{ tt('features.admin.feedback.filters.language','Language') }}</span>
            <USelectMenu v-model="advanced.language" :items="languageOptions" value-key="value" option-attribute="label" />
          </div>
          <div class="flex flex-col gap-2 w-full sm:w-60">
            <span class="text-xs uppercase tracking-wide text-gray-500">{{ tt('features.admin.feedback.filters.entityType','Entity type') }}</span>
            <USelectMenu v-model="advanced.entityType" :items="entityTypeOptions" value-key="value" option-attribute="label" />
          </div>
        </div>

        <div class="flex flex-wrap gap-4">
          <div class="flex flex-col gap-2 w-full sm:w-72">
            <span class="text-xs uppercase tracking-wide text-gray-500">{{ tt('features.admin.feedback.filters.createdRange','Created range') }}</span>
            <UPopover :popper="{ placement: 'bottom-start' }">
              <UButton
                block
                color="neutral"
                variant="outline"
                icon="i-heroicons-calendar-days-20-solid"
                class="justify-between"
              >
                <span class="truncate">{{ createdRangeLabel }}</span>
              </UButton>
              <template #panel>
                <div class="p-2">
                  <UCalendar v-model="advanced.createdRange" :number-of-months="1" range close-on-select />
                </div>
              </template>
            </UPopover>
          </div>
          <div class="flex flex-col gap-2 w-full sm:w-72">
            <span class="text-xs uppercase tracking-wide text-gray-500">{{ tt('features.admin.feedback.filters.resolvedRange','Resolved range') }}</span>
            <UPopover :popper="{ placement: 'bottom-start' }">
              <UButton
                block
                color="neutral"
                variant="outline"
                icon="i-heroicons-calendar-days-20-solid"
                class="justify-between"
              >
                <span class="truncate">{{ resolvedRangeLabel }}</span>
              </UButton>
              <template #panel>
                <div class="p-2">
                  <UCalendar v-model="advanced.resolvedRange" :number-of-months="1" range close-on-select />
                </div>
              </template>
            </UPopover>
          </div>
        </div>

        <div class="flex flex-wrap gap-4">
          <div class="flex flex-col gap-2 w-full sm:w-60">
            <span class="text-xs uppercase tracking-wide text-gray-500">{{ tt('features.admin.feedback.filters.createdBy','Created by') }}</span>
            <USelectMenu v-model="advanced.createdBy" :items="userOptions" value-key="value" option-attribute="label" searchable />
          </div>
          <div class="flex flex-col gap-2 w-full sm:w-60">
            <span class="text-xs uppercase tracking-wide text-gray-500">{{ tt('features.admin.feedback.filters.resolvedBy','Resolved by') }}</span>
            <USelectMenu v-model="advanced.resolvedBy" :items="userOptions" value-key="value" option-attribute="label" searchable />
          </div>
        </div>
      </AdvancedFiltersPanel>

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
                :entity="previewCard.entity_type || ''"
                :type-label="previewCard.card_type_name || previewCard.card_type_code || ''"
                :name="previewCard.name || previewCard.code"
                :short-text="previewCard.short_text || ''"
                :description="previewCard.description || ''"
                :img="previewCard.image || previewCard.thumbnail_url || null"
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
import JsonModal from '@/components/common/JsonModal.vue'
import FeedbackNotesModal from '@/components/admin/FeedbackNotesModal.vue'
import FeedbackDashboard from '@/components/admin/FeedbackDashboard.vue'
import PaginationControls from '@/components/common/PaginationControls.vue'
import AdvancedFiltersPanel from '@/components/common/AdvancedFiltersPanel.vue'
import { useContentFeedback } from '@/composables/admin/useContentFeedback'
import { useCurrentUser } from '@/composables/users/useCurrentUser'
import { useApiFetch } from '@/utils/fetcher'
import { useDebounceFn } from '@vueuse/core'
import { useQuerySync } from '@/composables/common/useQuerySync'
import { normalizeRange } from '@/composables/common/useDateRange'

const { t, te } = useI18n()
function tt(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}

useSeoMeta({ title: `${t('navigation.menu.admin') || 'Admin'} · ${tt('features.admin.feedbackTitle', 'Feedback')}` })

const toast = useToast()
const apiFetch = useApiFetch
const router = useRouter()
const route = useRoute()

type FeedbackRouteState = {
  search: string
  status: 'all' | 'open' | 'resolved'
  type: 'all' | 'bug' | 'suggestion' | 'balance' | 'translation'
  mineOnly: boolean
  language?: string
  entityType?: string
  createdBy?: number
  resolvedBy?: number
  createdRange?: [Date | string, Date | string] | undefined
  resolvedRange?: [Date | string, Date | string] | undefined
  page: number
  pageSize: number
}

const initialState: FeedbackRouteState = {
  search: '',
  status: 'all',
  type: 'all',
  mineOnly: false,
  language: undefined,
  entityType: undefined,
  createdBy: undefined,
  resolvedBy: undefined,
  createdRange: undefined,
  resolvedRange: undefined,
  page: 1,
  pageSize: 20,
}

const { read: readQueryState, write: writeQueryState } = useQuerySync<FeedbackRouteState>(initialState, {
  parse(raw) {
    const statusParam = raw.status === 'open' || raw.status === 'resolved' ? raw.status : 'all'
    const typeParam = raw.type === 'bug' || raw.type === 'suggestion' || raw.type === 'balance' || raw.type === 'translation'
      ? raw.type
      : 'all'
    const mineOnlyParam = raw.mineOnly === 'true'
    const createdByParam = typeof raw.created_by === 'string' ? Number(raw.created_by) : undefined
    const resolvedByParam = typeof raw.resolved_by === 'string' ? Number(raw.resolved_by) : undefined

    const createdRange = normalizeRange({ from: raw.created_from as any, to: raw.created_to as any })
    const resolvedRange = normalizeRange({ from: raw.resolved_from as any, to: raw.resolved_to as any })

    const parseRange = (range: { from?: string; to?: string }) => {
      if (!range.from || !range.to) return undefined
      const fromDate = new Date(range.from)
      const toDate = new Date(range.to)
      if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return undefined
      return [fromDate, toDate] as [Date, Date]
    }

    const pageParam = typeof raw.page === 'string' ? Math.max(1, Number(raw.page) || 1) : 1
    const pageSizeParam = typeof raw.pageSize === 'string' && [10, 20, 50].includes(Number(raw.pageSize))
      ? Number(raw.pageSize)
      : 20

    return {
      search: typeof raw.search === 'string' ? raw.search : '',
      status: statusParam,
      type: typeParam,
      mineOnly: mineOnlyParam,
      language: typeof raw.language_code === 'string' ? raw.language_code : undefined,
      entityType: typeof raw.entity_type === 'string' ? raw.entity_type : undefined,
      createdBy: createdByParam,
      resolvedBy: resolvedByParam,
      createdRange: parseRange(createdRange),
      resolvedRange: parseRange(resolvedRange),
      page: pageParam,
      pageSize: pageSizeParam,
    }
  },
  serialize(state) {
    const createdRange = normalizeRange(state.createdRange)
    const resolvedRange = normalizeRange(state.resolvedRange)

    return {
      search: state.search || undefined,
      status: state.status !== 'all' ? state.status : undefined,
      type: state.type !== 'all' ? state.type : undefined,
      mineOnly: state.mineOnly ? 'true' : undefined,
      language_code: state.language || undefined,
      entity_type: state.entityType || undefined,
      created_by: state.createdBy != null ? String(state.createdBy) : undefined,
      resolved_by: state.resolvedBy != null ? String(state.resolvedBy) : undefined,
      created_from: createdRange.from,
      created_to: createdRange.to,
      resolved_from: resolvedRange.from,
      resolved_to: resolvedRange.to,
      page: state.page > 1 ? String(state.page) : undefined,
      pageSize: state.pageSize !== 20 ? String(state.pageSize) : undefined,
    }
  },
})

const queryState = readQueryState()

const search = ref(queryState.search ?? '')
const status = ref<'all' | 'open' | 'resolved'>(queryState.status ?? 'all')
const type = ref<'all' | 'bug' | 'suggestion' | 'balance' | 'translation'>(queryState.type ?? 'all')
const mineOnly = ref(!!queryState.mineOnly)

const counts = ref<{ bug: number; suggestion: number; balance: number; translation: number }>({ bug: 0, suggestion: 0, balance: 0, translation: 0 })
const feedbackTabs = computed(() => [
  { label: tt('admin.feedback.tabs.all', 'All'), value: 'all' },
  { label: `${tt('admin.feedback.tabs.bug', 'Bugs')} (${counts.value.bug})`, value: 'bug' },
  { label: `${tt('admin.feedback.tabs.suggestion', 'Suggestions')} (${counts.value.suggestion})`, value: 'suggestion' },
  { label: `${tt('admin.feedback.tabs.balance', 'Balance')} (${counts.value.balance})`, value: 'balance' },
  { label: `${tt('admin.feedback.tabs.translation', 'Translation')} (${counts.value.translation})`, value: 'translation' },
])

const initialized = ref(false)

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

const advancedOpen = ref(false)
const advanced = reactive({
  language: queryState.language as string | undefined,
  entityType: queryState.entityType as string | undefined,
  createdRange: queryState.createdRange as [Date | string, Date | string] | undefined,
  resolvedRange: queryState.resolvedRange as [Date | string, Date | string] | undefined,
  createdBy: queryState.createdBy as number | undefined,
  resolvedBy: queryState.resolvedBy as number | undefined,
})

const languageOptions = computed(() => [{ label: tt('ui.filters.all', 'All'), value: undefined }, { label: 'EN', value: 'en' }, { label: 'ES', value: 'es' }])
const entityTypeOptions = computed(() => [
  { label: tt('ui.filters.all', 'All'), value: undefined },
  { label: tt('entities.base_card', 'Base card'), value: 'base_card' },
  { label: tt('entities.base_card_type', 'Card type'), value: 'base_card_type' },
  { label: tt('entities.world', 'World'), value: 'world' },
  { label: tt('entities.world_card', 'World card'), value: 'world_card' },
  { label: tt('entities.arcana', 'Arcana'), value: 'arcana' },
  { label: tt('entities.facet', 'Facet'), value: 'facet' },
  { label: tt('entities.base_skills', 'Skills'), value: 'base_skills' },
])
const userOptions = computed(() => {
  const users = currentUser.value?.team ?? []
  const base = users.map((u: any) => ({ label: u.username || u.email, value: u.id }))
  return [{ label: tt('ui.filters.any', 'Any'), value: undefined }, ...base]
})

const filters = computed(() => {
  const payload: Record<string, any> = {
    search: search.value || undefined,
    status: status.value !== 'all' ? status.value : undefined,
    category: type.value !== 'all' ? type.value : undefined,
    created_by: mineOnly.value ? currentUserId.value : undefined,
    language_code: advanced.language,
    entity_type: advanced.entityType,
    created_from: advanced.createdRange?.[0],
    created_to: advanced.createdRange?.[1],
    resolved_from: advanced.resolvedRange?.[0],
    resolved_to: advanced.resolvedRange?.[1],
    resolved_by: advanced.resolvedBy,
  }
  if (!mineOnly.value && advanced.createdBy) payload.created_by = advanced.createdBy
  return payload
})

const dashboardQuery = computed(() => ({
  status: filters.value.status ?? null,
  type: filters.value.category ?? null,
}))

const pagination = reactive({ page: queryState.page ?? 1, pageSize: queryState.pageSize ?? 20 })
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

function formatRangeLabel(range: [Date | string, Date | string] | undefined, fallback: string) {
  if (!range || !range[0] || !range[1]) return fallback
  const formatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  const start = new Date(range[0])
  const end = new Date(range[1])
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return fallback
  return `${formatter.format(start)} – ${formatter.format(end)}`
}

const createdRangeLabel = computed(() => formatRangeLabel(advanced.createdRange, tt('features.admin.feedback.filters.anyDate','Any date')))
const resolvedRangeLabel = computed(() => formatRangeLabel(advanced.resolvedRange, tt('features.admin.feedback.filters.anyDate','Any date')))

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
  const toIso = (value?: Date | string) => {
    if (!value) return undefined
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return undefined
    return date.toISOString()
  }
  router.replace({
    query: {
      ...route.query,
      search: search.value || undefined,
      status: status.value !== 'all' ? status.value : undefined,
      type: type.value !== 'all' ? type.value : undefined,
      mineOnly: mineOnly.value ? 'true' : undefined,
      language_code: advanced.language || undefined,
      entity_type: advanced.entityType || undefined,
      created_by: !mineOnly.value && advanced.createdBy ? String(advanced.createdBy) : mineOnly.value ? String(currentUserId.value ?? '') || undefined : undefined,
      resolved_by: advanced.resolvedBy ? String(advanced.resolvedBy) : undefined,
      created_from: toIso(advanced.createdRange?.[0]),
      created_to: toIso(advanced.createdRange?.[1]),
      resolved_from: toIso(advanced.resolvedRange?.[0]),
      resolved_to: toIso(advanced.resolvedRange?.[1]),
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

function applyAdvanced() {
  pagination.page = 1
  loadList({ page: 1 })
  fetchCountsByType()
  advancedOpen.value = false
}

function resetAdvanced() {
  advanced.language = undefined
  advanced.entityType = undefined
  advanced.createdRange = undefined
  advanced.resolvedRange = undefined
  advanced.createdBy = undefined
  advanced.resolvedBy = undefined
  pagination.page = 1
  loadList({ page: 1 })
  fetchCountsByType()
  pushQuery()
}

onMounted(async () => {
  await loadList()
  await fetchCountsByType()
  pushQuery()
  initialized.value = true
})

const entityPreviewMap: Record<string, string> = {
  base_card: '/base_card',
  base_card_translation: '/base_card',
  base_card_translations: '/base_card',
  base_card_type: '/card_type',
  base_card_type_translation: '/card_type',
  base_card_type_translations: '/card_type',
  world: '/world',
  world_translation: '/world',
  world_translations: '/world',
  world_card: '/world_card',
  arcana: '/arcana',
  arcana_translation: '/arcana',
  arcana_translations: '/arcana',
  facet: '/facet',
  facet_translation: '/facet',
  facet_translations: '/facet',
  base_skills: '/skills',
  base_skills_translation: '/skills',
  base_skills_translations: '/skills',
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
  const types = ['bug', 'suggestion', 'balance', 'translation'] as const
  try {
    const baseFilters: Record<string, any> = {
      search: filters.value.search,
      status: filters.value.status,
      created_by: filters.value.created_by,
      language_code: filters.value.language_code,
      entity_type: filters.value.entity_type,
      created_from: filters.value.created_from,
      created_to: filters.value.created_to,
      resolved_from: filters.value.resolved_from,
      resolved_to: filters.value.resolved_to,
      resolved_by: filters.value.resolved_by,
    }
    const [bug, suggestion, balance, translation] = await Promise.all(
      types.map(t => fetchMeta({ ...baseFilters, category: t, page: 1, pageSize: 1 })),
    )
    counts.value = {
      bug: bug?.totalItems ?? 0,
      suggestion: suggestion?.totalItems ?? 0,
      balance: balance?.totalItems ?? 0,
      translation: translation?.totalItems ?? 0,
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
