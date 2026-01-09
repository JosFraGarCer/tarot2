// app/composables/manage/useEntity.ts
/* 
Generic SSR-safe CRUD composable for any entity.
  - Lists loaded with useAsyncData (SSR-ready)
  - $fetch for fetchOne/create/update/remove
  - Reactive filters + pagination + i18n lang param
  - Optional Zod validation for create/update
*/

import { ref, computed, watch, watchEffect, reactive, shallowRef, onMounted, onUnmounted } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { z } from 'zod'
import { useAsyncData, useI18n } from '#imports'
import { useApiFetch, clearApiFetchCache } from '@/utils/fetcher'
import { usePaginatedList } from '~/composables/manage/usePaginatedList'
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
  message?: string
  meta?: ApiMeta
}

// Options accepted by the generic entity composable
export type EntityFilterConfig = Record<string, string | true>

export interface EntityOptions<_TList, TCreate, TUpdate> {
  resourcePath: string
  schema?: {
    create?: z.ZodType<TCreate>
    update?: z.ZodType<TUpdate>
  }
  filters?: Record<string, unknown>
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
  filters: Record<string, unknown>
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
  updateStatus: (id: string | number, nextStatus: unknown) => Promise<TList>
  updateTags: (id: string | number, tagIds: number[]) => Promise<TList>
  nextPage: () => void
  prevPage: () => void
  registerPageSizeOptions: (...values: number[]) => void
}

// Utilities
function toErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error'
  const anyErr = err as Record<string, unknown>
  const status = anyErr?.status || (anyErr?.response as Record<string, unknown>)?.status
  if (status === 401 || status === 403) return 'Not allowed to perform this action.'
  if (status === 422) return (anyErr?.data as Record<string, unknown>)?.message as string || 'Validation error'
  return (
    ((anyErr?.data as Record<string, unknown>)?.message as string) ||
    (anyErr?.message as string) ||
    (typeof anyErr === 'string' ? anyErr : JSON.stringify(anyErr))
  )
}

function normalizeFilters(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'search' && typeof value !== 'string') continue
    if (value === '' || value === null || value === undefined || value === 'all') continue
    if (Array.isArray(value) && value.length === 0) continue
    out[key] = value
  }
  return out
}

function pruneUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const k in obj) {
    const v = obj[k]
    if (v !== undefined) out[k] = v
  }
  return out as T
}

function sanitizeInitialFilters(raw: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
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

function normalizeFilterConfig(raw?: EntityFilterConfig | Record<string, unknown>): EntityFilterConfig {
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

type GenericMeta = Partial<ApiMeta> & Record<string, unknown>

interface NormalizedListResponse<TItem> {
  items: TItem[]
  meta?: GenericMeta
  totalItems: number
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : undefined
}

function normalizeMeta(metaCandidate: unknown): GenericMeta | undefined {
  if (!metaCandidate || typeof metaCandidate !== 'object') return undefined
  const cand = metaCandidate as Record<string, unknown>
  const meta: GenericMeta = { ...cand }

  const page = toNumber(cand.page ?? cand.page_number ?? cand.current_page ?? cand.pageNumber ?? cand.currentPage)
  if (page !== undefined) meta.page = page

  const pageSize = toNumber(cand.pageSize ?? cand.page_size ?? cand.per_page ?? cand.perPage ?? cand.limit)
  if (pageSize !== undefined) meta.pageSize = pageSize

  const totalItems = toNumber(cand.totalItems ?? cand.total ?? cand.total_count ?? cand.totalResults ?? cand.total_records ?? cand.count)
  if (totalItems !== undefined) meta.totalItems = totalItems

  const count = toNumber(cand.count)
  if (count !== undefined) meta.count = count

  return meta
}

function normalizeListResponse<TItem>(raw: unknown): NormalizedListResponse<TItem> {
  if (!raw) return { items: [], totalItems: 0 }
  if (Array.isArray(raw)) return { items: raw as TItem[], totalItems: raw.length }

  const r = raw as Record<string, unknown>
  const containers = [r, r.data, r.payload, r.body, r.result]
  let items: TItem[] = []

  for (const container of containers) {
    if (!container) continue
    if (Array.isArray(container)) {
      items = container as TItem[]
      break
    }
    for (const key of ['data', 'results', 'items', 'rows', 'list', 'records']) {
      const candidate = (container as Record<string, unknown>)?.[key]
      if (Array.isArray(candidate)) {
        items = candidate as TItem[]
        break
      }
    }
    if (items.length) break
  }

  const metaCandidates = [
    r.meta, r.pagination, r.pageInfo, r.metaData, r.meta_data, r.paging,
    (r.data as Record<string, unknown>)?.meta,
    (r.data as Record<string, unknown>)?.pagination,
    (r.payload as Record<string, unknown>)?.meta,
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
    const inline = normalizeMeta(r)
    if (inline) meta = inline
  }

  const totalCandidates: Array<unknown> = [
    meta?.totalItems, meta?.total, meta?.count, r.totalItems, r.total, r.count, r.total_count, r.size,
    (r.data as Record<string, unknown>)?.total,
    (r.data as Record<string, unknown>)?.count,
    (r.data as Record<string, unknown>)?.total_count,
    (r.pagination as Record<string, unknown>)?.total,
    (r.pagination as Record<string, unknown>)?.totalItems,
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
    const coercedPage = toNumber(meta.page ?? r.page ?? r.currentPage)
    if (coercedPage !== undefined) meta.page = coercedPage
    const coercedPageSize = toNumber(meta.pageSize ?? r.pageSize ?? r.perPage)
    if (coercedPageSize !== undefined) meta.pageSize = coercedPageSize
  }

  return { items, meta, totalItems }
}

// Main composable
export function useEntity<TList, TCreate, TUpdate>(
  options: EntityOptions<TList, TCreate, TUpdate>
): EntityCrud<TList, TCreate, TUpdate> {
  const { locale } = useI18n()
  const lang = computed(() => (typeof locale === 'string' ? locale : locale.value) as string)

  const includeLangParam = options.includeLangParam !== false
  const includeLangInCreateBody = options.includeLangInCreateBody !== false

  function resolveCreateLang(): string | undefined {
    if (!includeLangInCreateBody) return undefined
    const custom = options.createLangValue
    if (typeof custom === 'function') return custom(lang.value)
    return custom ?? 'en'
  }

  const filters = reactive<Record<string, unknown>>(sanitizeInitialFilters(options.filters || {}))
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

  watch(() => pagination.value.page, (val) => {
    if (val !== paginated.page.value) paginated.setPage(val)
  })
  watch(() => pagination.value.pageSize, (val) => {
    if (val !== paginated.pageSize.value) paginated.setPageSize(val)
  })

  watch([paginated.page, paginated.pageSize, paginated.totalItems], ([p, s, t]) => {
    pagination.value.page = p
    pagination.value.pageSize = s
    pagination.value.totalItems = t
  }, { immediate: true })

  const items = shallowRef<TList[]>([])
  const current = shallowRef<TList | null>(null)
  const listError = ref<string | null>(null)
  const actionError = ref<string | null>(null)
  const error = computed<string | null>(() => actionError.value ?? listError.value)

  const actionPending = ref(false)

  const debouncedFiltersStr = ref(JSON.stringify(filters))
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  watch(
    () => JSON.stringify(filters),
    (newFiltersStr) => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        debouncedFiltersStr.value = newFiltersStr
        paginated.setPage(1)
        void fetchList()
      }, 300)
    },
    { deep: true }
  )

  const listKey = computed(() => {
    const uid = options.resourcePath.replace(/[^\w]/g, '_')
    return `entity:${uid}::${lang.value}::${paginated.page.value}::${paginated.pageSize.value}::${debouncedFiltersStr.value}`
  })

  let listAbort: AbortController | null = null
  const listCache: Map<string, unknown> = new Map()

  function invalidateDeckCaches() {
    if (!import.meta.client) return
    if (!options.resourcePath) return
    const escaped = escapeRegExp(options.resourcePath.replace(/^\/api/, ''))
    const pattern = new RegExp(`^GET:${escaped}`)
    clearApiFetchCache({ pattern })
  }

  const { data: listData, pending: listPending, error: listErr, refresh } =
    useAsyncData<NormalizedListResponse<TList>>(listKey, async () => {
      if (listAbort) {
        try { listAbort.abort() } catch { }
      }
      listAbort = new AbortController()

      const params = pruneUndefined({
        ...normalizeFilters(filters),
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        ...(includeLangParam ? { lang: lang.value } : {}),
      })
      const raw = await $fetch<Record<string, unknown>>(options.resourcePath, {
        method: 'GET',
        signal: listAbort.signal,
        params,
      })
      return normalizeListResponse<TList>(raw)
    }, {
      watch: [listKey, () => lang.value],
      immediate: true,
      server: true,
    })

  watchEffect(() => {
    const val = listData.value
    if (!val) {
      items.value = []
      paginated.syncMeta({ totalItems: 0 })
      pagination.value.page = paginated.page.value
      pagination.value.pageSize = paginated.pageSize.value
      pagination.value.totalItems = paginated.totalItems.value
      return
    }

    items.value = Array.isArray(val.items) ? val.items : []
    const meta = val.meta
    const pending = !!listPending.value
    const totalItemsFromMeta = meta?.totalItems ?? meta?.count ?? val.totalItems ?? items.value.length

    paginated.syncMeta({
      page: !pending ? meta?.page : undefined,
      pageSize: !pending ? meta?.pageSize : undefined,
      totalItems: totalItemsFromMeta,
    })

    pagination.value.page = paginated.page.value
    pagination.value.pageSize = paginated.pageSize.value
    pagination.value.totalItems = paginated.totalItems.value

    try { listCache.set(listKey.value, val) } catch { }
  })

  watch(
    () => listErr.value,
    (e) => {
      if (e) listError.value = toErrorMessage(e)
      else listError.value = null
    },
    { immediate: true }
  )

  const loading = computed(() => !!listPending.value || actionPending.value)

  async function fetchList(): Promise<TList[]> {
    listError.value = null
    await refresh()
    return items.value
  }

  async function fetchOne(id: string | number): Promise<TList | null> {
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

  async function create(payload: TCreate): Promise<TList> {
    actionError.value = null
    actionPending.value = true
    try {
      const parsed = options.schema?.create ? options.schema.create.parse(payload) : payload
      const createLang = resolveCreateLang()
      const bodyPayload = (includeLangInCreateBody && createLang !== undefined)
        ? { lang: createLang, ...parsed }
        : parsed
      const res = await $fetch<ApiResponse<TList>>(options.resourcePath, {
        method: 'POST',
        params: includeLangParam ? { lang: lang.value } : undefined,
        body: bodyPayload as Record<string, unknown>,
      })
      if (res?.success === false) throw new Error(res?.message || 'Create failed')
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

  async function update(id: string | number, payload: TUpdate): Promise<TList> {
    if (!id) throw new Error('Missing ID for update')
    actionError.value = null
    actionPending.value = true
    try {
      const schema = options.schema?.update as any
      const parsed = schema?.partial ? schema.partial().parse(payload) : payload
      const res = await $fetch<ApiResponse<TList>>(`${options.resourcePath}/${id}`, {
        method: 'PATCH',
        params: includeLangParam ? { lang: lang.value } : undefined,
        body: parsed as Record<string, unknown>,
      })
      if (res?.success === false) throw new Error(res?.message || 'Update failed')
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

  async function remove(id: string | number): Promise<boolean> {
    actionError.value = null
    actionPending.value = true
    try {
      const res = await $fetch<any>(`${options.resourcePath}/${id}`, {
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

  async function updateStatus(id: string | number, nextStatus: unknown): Promise<TList> {
    return update(id, { status: nextStatus } as unknown as TUpdate)
  }

  async function updateTags(id: string | number, tagIds: number[]): Promise<TList> {
    actionError.value = null
    actionPending.value = true
    try {
      const res = await $fetch<ApiResponse<TList>>(`${options.resourcePath}/${id}`, {
        method: 'PATCH',
        params: includeLangParam ? { lang: lang.value } : undefined,
        body: { tag_ids: tagIds } as Record<string, unknown>,
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

  function nextPage() { paginated.setPage(paginated.page.value + 1) }
  function prevPage() { paginated.setPage(Math.max(1, paginated.page.value - 1)) }

  if (import.meta.client) {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    onMounted(() => document.addEventListener('visibilitychange', handleVisibility))
    onUnmounted(() => document.removeEventListener('visibilitychange', handleVisibility))
  }

  return {
    items, current, filters, filterConfig, pagination,
    pageSizeOptions: paginated.options,
    loading, error, listError, actionError, lang,
    resourcePath: options.resourcePath,
    schema: options.schema,
    fetchList, fetchOne, create, update, remove,
    updateStatus, updateTags, nextPage, prevPage,
    registerPageSizeOptions: paginated.registerPageSizeOptions,
  }
}
