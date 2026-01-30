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
import { useApiFetch, clearApiFetchCache } from '@/utils/fetcher'
import { usePaginatedList } from '~/composables/manage/usePaginatedList'
import {
  normalizeFilters,
  pruneUndefined,
  sanitizeInitialFilters,
  normalizeListResponse,
  escapeRegExp,
  type NormalizedListResponse,
} from '~/composables/manage/useEntityFetch'

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
export type EntityFilterConfig = Record<string, string | boolean | undefined | true>

export interface EntityOptions<TList, TCreate, TUpdate> {
  resourcePath: string
  schema?: {
    create?: z.ZodType<TCreate>
    update?: z.ZodType<TUpdate>
  }
  filters?: Record<string, any>
  filterConfig?: EntityFilterConfig
  pagination?: boolean | { page: number; pageSize: number }
  pageSizeOptions?: number[]
  includeLangParam?: boolean
  includeLangInCreateBody?: boolean
  createLangValue?: string | ((currentLang: string) => string)
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
  filterConfig: EntityFilterConfig
  pagination: Ref<PaginationState>
  pageSizeOptions: ComputedRef<number[]>
  loading: ComputedRef<boolean>
  error: ComputedRef<string | null>
  listError: Ref<string | null>
  actionError: Ref<string | null>
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
  registerPageSizeOptions: (...values: number[]) => void
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

function normalizeFilterConfig(raw?: EntityFilterConfig | Record<string, any>): EntityFilterConfig {
  if (!raw) return {}
  const normalized: EntityFilterConfig = {}
  for (const [alias, target] of Object.entries(raw)) {
    if (typeof target === 'string' && target.length) {
      normalized[alias] = target
    } else if (target === true) {
      normalized[alias] = true
    }
  }
  return normalized
}

// Main composable
export function useEntity<TList, TCreate, TUpdate>(
  options: EntityOptions<TList, TCreate, TUpdate>
): EntityCrud<TList, TCreate, TUpdate> {
  // i18n locale as reactive language code (always primitive string)
  const { locale } = useI18n()
  const lang = computed(() => (typeof locale === 'string' ? locale : locale.value) as string)

  const includeLangParam = options.includeLangParam !== false
  const includeLangInCreateBody = options.includeLangInCreateBody !== false

  function resolveCreateLang(): string | undefined {
    if (!includeLangInCreateBody) return undefined
    const custom = options.createLangValue
    if (typeof custom === 'function') {
      return custom(lang.value)
    }
    return custom ?? 'en'
  }

  // Reactive filters & pagination setup
  const filters = reactive<Record<string, any>>(sanitizeInitialFilters(options.filters || {}))
  const filterConfig = normalizeFilterConfig(options.filterConfig)
  const defaultPage = 1
  const defaultPageSize = 20
  const initial = options.pagination && typeof options.pagination === 'object'
    ? options.pagination
    : { page: defaultPage, pageSize: defaultPageSize }

  const paginated = usePaginatedList(filters, {
    initialPage: initial.page ?? defaultPage,
    initialPageSize: initial.pageSize ?? defaultPageSize,
    pageSizeOptions: Array.isArray(options.pageSizeOptions) ? options.pageSizeOptions : undefined,
  })

  const pagination = ref<PaginationState>({
    page: paginated.page.value,
    pageSize: paginated.pageSize.value,
    totalItems: paginated.totalItems.value,
  })

  // Core state
  const items = shallowRef<TList[]>([])
  const current = shallowRef<TList | null>(null)
  const listError = ref<string | null>(null)
  const actionError = ref<string | null>(null)
  const error = computed<string | null>(() => actionError.value ?? listError.value)

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
      paginated.resetPage()
    },
    { deep: true }
  )

  watch(
    [paginated.page, paginated.pageSize, paginated.totalItems],
    ([pageValue, pageSizeValue, totalItemsValue]) => {
      const current = pagination.value
      if (current.page !== pageValue) current.page = pageValue
      if (current.pageSize !== pageSizeValue) current.pageSize = pageSizeValue
      if (current.totalItems !== totalItemsValue) current.totalItems = totalItemsValue
    },
    { immediate: true }
  )

  // Consolidate pagination sync watchers into single bidirectional watcher
  watch(
    () => [pagination.value.page, pagination.value.pageSize, pagination.value.totalItems],
    ([pageValue, pageSizeValue, totalItemsValue]) => {
      if (pageValue !== paginated.page.value) paginated.setPage(pageValue)
      if (pageSizeValue !== paginated.pageSize.value) paginated.setPageSize(pageSizeValue)
      if (totalItemsValue !== paginated.totalItems.value) paginated.syncMeta({ totalItems: totalItemsValue })
    }
  )

  // Build a stable cache key for useAsyncData based on resource + debounced filters + pagination + lang
  const listKey = computed(() => {
    const f = debouncedFiltersStr.value
    const uid = options.resourcePath.replace(/[^\w]/g, '_') // ejemplo: _api_card_type
    return `entity:${uid}::${lang.value}::${paginated.page.value}::${paginated.pageSize.value}::${f}`
  })

  // Abortable fetch controller to cancel in-flight list requests
  let listAbort: AbortController | null = null

  // In-memory SWR cache with LRU eviction to prevent memory leaks
  const listCache = new Map<string, NormalizedListResponse<TList>>()
  const MAX_CACHE_SIZE = 50

  function setCache(key: string, value: NormalizedListResponse<TList>) {
    if (listCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry (first key)
      const firstKey = listCache.keys().next().value
      listCache.delete(firstKey)
    }
    listCache.set(key, value)
  }

  function invalidateDeckCaches() {
    if (!process.client) return
    if (!options.resourcePath) return
    const escaped = escapeRegExp(options.resourcePath.replace(/^\/api/, ''))
    const pattern = new RegExp(`^GET:${escaped}`)
    clearApiFetchCache({ pattern })
  }

  const { data: listData, pending: listPending, error: listErr, refresh } =
    useAsyncData<NormalizedListResponse<TList>>(listKey, async () => {
      if (listAbort) {
        try { listAbort.abort() } catch {}
      }
      listAbort = new AbortController()
      const params = pruneUndefined({
        ...normalizeFilters(filters),
        page: paginated.page.value,
        pageSize: paginated.pageSize.value,
        ...(includeLangParam ? { lang: lang.value } : {}),
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
      paginated.syncMeta({ totalItems: 0 })
      const snapshot = pagination.value
      snapshot.page = paginated.page.value
      snapshot.pageSize = paginated.pageSize.value
      snapshot.totalItems = paginated.totalItems.value
      return
    }

    items.value = Array.isArray(val.items) ? val.items : []
    const meta = val.meta
    const pending = !!listPending.value
    const totalItemsFromMeta =
      meta?.totalItems ?? meta?.count ?? val.totalItems ?? items.value.length

    paginated.syncMeta({
      page: !pending ? (meta?.page as number | undefined) : undefined,
      pageSize: !pending ? (meta?.pageSize as number | undefined) : undefined,
      totalItems: Number(totalItemsFromMeta),
    })

    const snapshot = pagination.value
    snapshot.page = paginated.page.value
    snapshot.pageSize = paginated.pageSize.value
    snapshot.totalItems = paginated.totalItems.value

    setCache(listKey.value, val)
  })

  // Mirror list error into a single string error state
  watch(
    () => listErr.value,
    (e) => {
      if (e) listError.value = toErrorMessage(e)
      else listError.value = null
    },
    { immediate: true }
  )

  // Unified loading flag across list and actions
  const loading: ComputedRef<boolean> = computed(() => !!listPending.value || actionPending.value)

  // Manual list refresh (SSR-ready)
  async function fetchList() {
    listError.value = null
    await refresh()
    return items.value
  }

  // Fetch one entity by id
  async function fetchOne(id: string | number) {
    actionError.value = null
    actionPending.value = true
    try {
      const res = await $fetch<ApiResponse<TList>>(`${options.resourcePath}/${id}`, {
        method: 'GET',
        params: includeLangParam ? { lang: lang.value } : undefined,
      })
      if (res?.success === false) throw new Error('Request failed')
      current.value = res?.data ?? null
      return current.value
    } catch (e) {
      actionError.value = toErrorMessage(e)
      throw e
    } finally {
      actionPending.value = false
    }
  }

  // Create an entity (POST) — always send body with lang: 'en'
  async function create(payload: TCreate) {
    actionError.value = null
    actionPending.value = true
    try {
      const parsed = options.schema?.create ? options.schema.create.parse(payload) : payload
      const createParams = includeLangParam ? { lang: lang.value } : undefined
      const createLang = resolveCreateLang()
      const bodyPayload = includeLangInCreateBody && createLang !== undefined
        ? { lang: createLang, ...(parsed as any) }
        : (parsed as any)
      const res = await $fetch<ApiResponse<TList>>(options.resourcePath, {
        method: 'POST',
        params: createParams,
        body: bodyPayload,
      })
      if (res?.success === false) throw new Error('Request failed')
      invalidateDeckCaches()
      return res.data
    } catch (e) {
      actionError.value = toErrorMessage(e)
      throw e
    } finally {
      actionPending.value = false
    }
  }

  // Update an entity (PATCH)
  async function update(id: string | number, payload: TUpdate) {
    actionError.value = null
    actionPending.value = true
    try {
      const parsed = options.schema?.update
        ? (options.schema.update as any).partial().parse(payload)
        : payload
      const res = await $fetch<ApiResponse<TList>>(`${options.resourcePath}/${id}`, {
        method: 'PATCH',
        params: includeLangParam ? { lang: lang.value } : undefined,
        body: parsed as any,
      })
      if (res?.success === false) throw new Error('Request failed')
      invalidateDeckCaches()
      return res.data
    } catch (e) {
      actionError.value = toErrorMessage(e)
      throw e
    } finally {
      actionPending.value = false
    }
  }

  // Remove an entity (DELETE) and auto-refresh list
  async function remove(id: string | number) {
    actionError.value = null
    actionPending.value = true
    try {
      const res = await $fetch<ApiResponse<null>>(`${options.resourcePath}/${id}`, {
        method: 'DELETE',
        params: includeLangParam ? { lang: lang.value } : undefined,
      })
      if (res?.success === false) throw new Error('Request failed')
      invalidateDeckCaches()
      await refresh()
      return true
    } catch (e) {
      actionError.value = toErrorMessage(e)
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
    actionError.value = null
    actionPending.value = true
    try {
      const res = await $fetch<ApiResponse<TList>>(`${options.resourcePath}/${id}`, {
        method: 'PATCH',
        params: includeLangParam ? { lang: lang.value } : undefined,
        body: { tag_ids: tagIds } as any,
      })
      if (res?.success === false) throw new Error('Request failed')
      invalidateDeckCaches()
      await refresh()
      return res.data
    } catch (e) {
      actionError.value = toErrorMessage(e)
      throw e
    } finally {
      actionPending.value = false
    }
  }

  // Pagination helpers
  function nextPage() {
    paginated.setPage(paginated.page.value + 1)
  }

  function prevPage() {
    paginated.setPage(Math.max(1, paginated.page.value - 1))
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

  return {
    // state
    items,
    current,
    filters,
    filterConfig,
    pagination,
    pageSizeOptions: paginated.options,
    loading,
    error,
    listError,
    actionError,
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
    registerPageSizeOptions: paginated.registerPageSizeOptions,
  }
}
