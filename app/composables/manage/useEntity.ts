// app/composables/manage/useEntity.ts
/* 
Generic SSR-safe CRUD composable for any entity.
  - Lists loaded with useAsyncData (SSR-ready)
  - $fetch for fetchOne/create/update/remove
  - Reactive filters + pagination + i18n lang param
  - Optional Zod validation for create/update
*/

import { ref, computed, watch, watchEffect, reactive, onMounted, onUnmounted, shallowRef } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { z } from 'zod'
import { useAsyncData, useI18n } from '#imports'
import { useApiFetch } from '@/utils/fetcher'
const $fetch = useApiFetch

// API response contract
interface ApiMeta {
  page?: number
  pageSize?: number
  totalItems?: number
  count?: number
  search?: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: ApiMeta
}

// Options accepted by the generic entity composable
export interface EntityOptions<TList, TCreate, TUpdate> {
  resourcePath: string
  schema?: {
    create?: z.ZodType<TCreate>
    update?: z.ZodType<TUpdate>
  }
  filters?: Record<string, any>
  pagination?: boolean | { page: number; pageSize: number }
}

// Pagination state exposed to consumers
export interface PaginationState {
  page: number
  pageSize: number
  totalItems: number
}

export interface EntityCrud<TList, TCreate, TUpdate> {
  items: Ref<TList[]>
  current: Ref<TList | null>
  filters: Record<string, any>
  pagination: Ref<PaginationState>
  loading: ComputedRef<boolean>
  error: Ref<string | null>
  lang: Ref<string>
  resourcePath: string
  schema?: EntityOptions<TList, TCreate, TUpdate>['schema']
  fetchList: () => Promise<TList[]>
  fetchOne: (id: string | number) => Promise<TList | null>
  create: (payload: TCreate) => Promise<TList>
  update: (id: string | number, payload: TUpdate) => Promise<TList>
  remove: (id: string | number) => Promise<boolean>
  updateStatus: (id: string | number, nextStatus: any) => Promise<TList>
  updateTags: (id: string | number, tagIds: number[]) => Promise<TList>
  nextPage: () => void
  prevPage: () => void
}

// Utilities
function toErrorMessage(err: any): string {
  if (!err) return 'Unknown error'
  const anyErr = err as any
  const status = anyErr?.status || anyErr?.response?.status
  if (status === 401 || status === 403) return 'Not allowed to perform this action.'
  if (status === 422) return anyErr?.data?.message || 'Validation error'
  return (
    anyErr?.data?.message ||
    anyErr?.message ||
    (typeof anyErr === 'string' ? anyErr : JSON.stringify(anyErr))
  )
}

function normalizeFilters(obj: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'search' && typeof value !== 'string') continue
    if (value === '' || value === null || value === undefined || value === 'all') continue
    if (Array.isArray(value) && value.length === 0) continue
    out[key] = value
  }
  return out
}

function pruneUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {}
  for (const k in obj) {
    const v = obj[k]
    if (v !== undefined) out[k] = v
  }
  return out as T
}

function sanitizeInitialFilters(raw: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (value === true) {
      if (key.endsWith('_ids')) sanitized[key] = []
      else sanitized[key] = undefined
      continue
    }
    sanitized[key] = value
  }
  return sanitized
}

type GenericMeta = Partial<ApiMeta> & Record<string, any>

interface NormalizedListResponse<TItem> {
  items: TItem[]
  meta?: GenericMeta
  totalItems: number
}

function toNumber(value: any): number | undefined {
  if (value === null || value === undefined) return undefined
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : undefined
}

function normalizeMeta(metaCandidate: any): GenericMeta | undefined {
  if (!metaCandidate || typeof metaCandidate !== 'object') return undefined
  const meta: GenericMeta = { ...metaCandidate }

  const page = toNumber(
    metaCandidate.page ??
    metaCandidate.page_number ??
    metaCandidate.current_page ??
    metaCandidate.pageNumber ??
    metaCandidate.currentPage
  )
  if (page !== undefined) meta.page = page

  const pageSize = toNumber(
    metaCandidate.pageSize ??
    metaCandidate.page_size ??
    metaCandidate.per_page ??
    metaCandidate.perPage ??
    metaCandidate.limit
  )
  if (pageSize !== undefined) meta.pageSize = pageSize

  const totalItems = toNumber(
    metaCandidate.totalItems ??
    metaCandidate.total ??
    metaCandidate.total_count ??
    metaCandidate.totalResults ??
    metaCandidate.total_records ??
    metaCandidate.count
  )
  if (totalItems !== undefined) meta.totalItems = totalItems

  const count = toNumber(metaCandidate.count)
  if (count !== undefined) meta.count = count

  return meta
}

function normalizeListResponse<TItem>(raw: any): NormalizedListResponse<TItem> {
  if (!raw) {
    return { items: [], totalItems: 0 }
  }

  if (Array.isArray(raw)) {
    return { items: raw as TItem[], totalItems: raw.length }
  }

  const containers = [raw, raw.data, raw.payload, raw.body, raw.result]
  let items: TItem[] = []

  for (const container of containers) {
    if (!container) continue
    if (Array.isArray(container)) {
      items = container as TItem[]
      break
    }
    for (const key of ['data', 'results', 'items', 'rows', 'list', 'records']) {
      const candidate = (container as any)?.[key]
      if (Array.isArray(candidate)) {
        items = candidate as TItem[]
        break
      }
    }
    if (items.length) break
  }

  const metaCandidates = [
    raw.meta,
    raw.pagination,
    raw.pageInfo,
    raw.metaData,
    raw.meta_data,
    raw.paging,
    raw.data?.meta,
    raw.data?.pagination,
    raw.payload?.meta,
  ].filter(Boolean)

  let meta: GenericMeta | undefined
  for (const candidate of metaCandidates) {
    const normalized = normalizeMeta(candidate)
    if (normalized) {
      meta = normalized
      break
    }
  }
  if (!meta) {
    const inline = normalizeMeta(raw)
    if (inline) meta = inline
  }

  const totalCandidates: Array<any> = [
    meta?.totalItems,
    meta?.total,
    meta?.count,
    raw.totalItems,
    raw.total,
    raw.count,
    raw.total_count,
    raw.size,
    raw.data?.total,
    raw.data?.count,
    raw.data?.total_count,
    raw.pagination?.total,
    raw.pagination?.totalItems,
  ]

  let totalItems = items.length
  for (const candidate of totalCandidates) {
    const num = toNumber(candidate)
    if (num !== undefined) {
      totalItems = num
      break
    }
  }

  if (meta) {
    if (meta.totalItems === undefined) meta.totalItems = totalItems
    const coercedPage = toNumber(meta.page ?? raw.page ?? raw.currentPage)
    if (coercedPage !== undefined) meta.page = coercedPage
    const coercedPageSize = toNumber(meta.pageSize ?? raw.pageSize ?? raw.perPage)
    if (coercedPageSize !== undefined) meta.pageSize = coercedPageSize
  }

  return { items, meta, totalItems }
}

// Main composable
export function useEntity<TList, TCreate, TUpdate>(
  options: EntityOptions<TList, TCreate, TUpdate>
): EntityCrud<TList, TCreate, TUpdate> {
  // i18n locale as reactive language code (ref)
  const { locale } = useI18n()
  const lang = locale as Ref<string>

  // Reactive filters & pagination setup
  const filters = reactive<Record<string, any>>(sanitizeInitialFilters(options.filters || {}))
  const defaultPage = 1
  const defaultPageSize = 20
  const initial = options.pagination && typeof options.pagination === 'object'
    ? options.pagination
    : { page: defaultPage, pageSize: defaultPageSize }

  const pagination = ref<PaginationState>({
    page: initial.page ?? defaultPage,
    pageSize: initial.pageSize ?? defaultPageSize,
    totalItems: 0,
  })

  // Core state
  const items = shallowRef<TList[]>([])
  const current = shallowRef<TList | null>(null)
  const error = ref<string | null>(null)

  // We combine list pending with actionPending to expose a single loading flag
  const actionPending = ref(false)

  // Debounced filters string to avoid excessive re-fetching while typing
  const debouncedFiltersStr = ref(JSON.stringify(filters))
  let debounceTimer: any = null
  watch(
    filters,
    () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        debouncedFiltersStr.value = JSON.stringify(filters)
      }, 300)
    },
    { deep: true }
  )

  // Build a stable cache key for useAsyncData based on resource + debounced filters + pagination + lang
  const listKey = computed(() => {
    const f = debouncedFiltersStr.value
    const uid = options.resourcePath.replace(/[^\w]/g, '_') // ejemplo: _api_card_type
    return `entity:${uid}::${lang.value}::${pagination.value.page}::${pagination.value.pageSize}::${f}`
  })

  // Abortable fetch controller to cancel in-flight list requests
  let listAbort: AbortController | null = null

  // In-memory SWR cache
  const listCache: Map<string, any> = new Map()

  const { data: listData, pending: listPending, error: listErr, refresh } =
    useAsyncData<NormalizedListResponse<TList>>(listKey, async () => {
      if (listAbort) {
        try { listAbort.abort() } catch {}
      }
      listAbort = new AbortController()
      const params = pruneUndefined({
        ...normalizeFilters(filters),
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        lang: lang.value,
      })
      const raw = await $fetch<any>(options.resourcePath, {
        method: 'GET',
        signal: listAbort.signal,
        params,
      })
      const normalized = normalizeListResponse<TList>(raw)
      return normalized
    }, {
      watch: [listKey],
      immediate: true,
      server: true,
    })

  // Keep exposed items and totalItems in sync with async data
  watchEffect(() => {
    const val = listData.value
    if (!val) {
      items.value = []
      pagination.value.totalItems = 0
      return
    }

    items.value = Array.isArray(val.items) ? val.items : []
    const meta = val.meta
    const pending = !!listPending.value
    pagination.value.totalItems =
      meta?.totalItems ?? meta?.count ?? val.totalItems ?? items.value.length

    if (meta?.page !== undefined) {
      if (!pending || meta.page === pagination.value.page) {
        pagination.value.page = meta.page
      }
    }

    if (meta?.pageSize !== undefined) {
      if (!pending || meta.pageSize === pagination.value.pageSize) {
        pagination.value.pageSize = meta.pageSize
      }
    }

    try { listCache.set(listKey.value, val) } catch {}
  })

  // Mirror list error into a single string error state
  watch(
    () => listErr.value,
    (e) => {
      if (e) error.value = toErrorMessage(e)
    },
    { immediate: true }
  )

  // Unified loading flag across list and actions
  const loading: ComputedRef<boolean> = computed(() => !!listPending.value || actionPending.value)

  // Manual list refresh (SSR-ready)
  async function fetchList() {
    error.value = null
    await refresh()
    return items.value
  }

  // Fetch one entity by id
  async function fetchOne(id: string | number) {
    error.value = null
    actionPending.value = true
    try {
      const res = await $fetch<ApiResponse<TList>>(`${options.resourcePath}/${id}`, {
        method: 'GET',
        params: { lang: lang.value },
      })
      if (res?.success === false) throw new Error('Request failed')
      current.value = res?.data ?? null
      return current.value
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      actionPending.value = false
    }
  }

  // Create an entity (POST) — always send body with lang: 'en'
  async function create(payload: TCreate) {
    error.value = null
    actionPending.value = true
    try {
      const parsed = options.schema?.create ? options.schema.create.parse(payload) : payload
      const res = await $fetch<ApiResponse<TList>>(options.resourcePath, {
        method: 'POST',
        params: { lang: lang.value },
        body: { lang: 'en', ...(parsed as any) },
      })
      if (res?.success === false) throw new Error('Request failed')
      return res.data
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      actionPending.value = false
    }
  }

  // Update an entity (PATCH)
  async function update(id: string | number, payload: TUpdate) {
    error.value = null
    actionPending.value = true
    try {
      const parsed = options.schema?.update
        ? (options.schema.update as any).partial().parse(payload)
        : payload
      const res = await $fetch<ApiResponse<TList>>(`${options.resourcePath}/${id}`, {
        method: 'PATCH',
        params: { lang: lang.value },
        body: parsed as any,
      })
      if (res?.success === false) throw new Error('Request failed')
      return res.data
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      actionPending.value = false
    }
  }

  // Remove an entity (DELETE) and auto-refresh list
  async function remove(id: string | number) {
    error.value = null
    actionPending.value = true
    try {
      const res = await $fetch<ApiResponse<null>>(`${options.resourcePath}/${id}`, {
        method: 'DELETE',
        params: { lang: lang.value },
      })
      if (res?.success === false) throw new Error('Request failed')
      await refresh()
      return true
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      actionPending.value = false
    }
  }

  // Update only the status field using PATCH
  async function updateStatus(id: string | number, nextStatus: any) {
    return update(id, { status: nextStatus } as unknown as TUpdate)
  }

  // Replace tag associations via tag_ids
  async function updateTags(id: string | number, tagIds: number[]) {
    error.value = null
    actionPending.value = true
    try {
      const res = await $fetch<ApiResponse<TList>>(`${options.resourcePath}/${id}`, {
        method: 'PATCH',
        params: { lang: lang.value },
        body: { tag_ids: tagIds } as any,
      })
      if (res?.success === false) throw new Error('Request failed')
      await refresh()
      return res.data
    } catch (e) {
      error.value = toErrorMessage(e)
      throw e
    } finally {
      actionPending.value = false
    }
  }

  // Pagination helpers
  function nextPage() {
    pagination.value.page += 1
  }

  function prevPage() {
    pagination.value.page = Math.max(1, pagination.value.page - 1)
  }

  // Auto-refresh on filters/page/lang changes is handled via useAsyncData watch: [listKey]
  // Consumers can still call fetchList() to force refresh if needed.

  // Revalidate on focus (client-only)
  if (process.client) {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }
    onMounted(() => document.addEventListener('visibilitychange', handleVisibility))
    onUnmounted(() => document.removeEventListener('visibilitychange', handleVisibility))
  }

  pagination.value.page ||= 1
  pagination.value.pageSize ||= 20
  pagination.value.totalItems ||= 0

  return {
    // state
    items,
    current,
    filters,
    pagination,
    loading,
    error,
    lang,
    resourcePath: options.resourcePath,
    schema: options.schema,

    // actions
    fetchList,
    fetchOne,
    create,
    update,
    remove,
    updateStatus,
    updateTags,

    // helpers
    nextPage,
    prevPage,
  }
}
