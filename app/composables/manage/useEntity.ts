// app/composables/manage/useEntity.ts
/* 
Generic SSR-safe CRUD composable for any entity.
  - Lists loaded with useAsyncData (SSR-ready)
  - $fetch for fetchOne/create/update/remove
  - Reactive filters + pagination + i18n lang param
  - Optional Zod validation for create/update
*/

import { ref, computed, watch, watchEffect  } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { z } from 'zod'
import { useAsyncData, useI18n } from '#imports'
import { useApiFetch } from '~/utils/fetcher'
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
interface PaginationState {
  page: number
  pageSize: number
  totalItems: number
}

// Utilities
function toErrorMessage(err: any): string {
  if (!err) return 'Unknown error'
  const anyErr = err as any
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
    if (value === true) continue // ⚠️ ignora flags true por defecto
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

// Main composable
export function useEntity<TList, TCreate, TUpdate>(
  options: EntityOptions<TList, TCreate, TUpdate>
) {
  // i18n locale as reactive language code (ref)
  const { locale } = useI18n()
  const lang = locale as Ref<string>

  // Reactive filters & pagination setup
  const filters = reactive<Record<string, any>>({ ...(options.filters || {}) })
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
  const items = ref<TList[]>([])
  const current = ref<TList | null>(null)
  const error = ref<string | null>(null)

  // We combine list pending with actionPending to expose a single loading flag
  const actionPending = ref(false)

  // Build a stable cache key for useAsyncData based on resource + filters + pagination + lang
  const listKey = computed(() => {
    const f = JSON.stringify(filters)
    const uid = options.resourcePath.replace(/[^\w]/g, '_') // ejemplo: _api_card_type
    return `entity:${uid}::${lang.value}::${pagination.value.page}::${pagination.value.pageSize}::${f}`
  })

  // List fetching with SSR via useAsyncData
const { data: listData, pending: listPending, error: listErr, refresh } =
  useAsyncData<ApiResponse<TList[]>>(listKey, async () => {
    const res = await $fetch<ApiResponse<TList[]>>(options.resourcePath, {
      method: 'GET',
      params: pruneUndefined({
        ...normalizeFilters(filters),
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        lang: lang.value,
      }),
    })
    return res
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

  // ✅ Soporte ApiResponse o array directo
  const data = Array.isArray(val) ? val : val.data
  if (Array.isArray(data)) items.value = data as TList[]
  else items.value = []

  const meta = (val as any)?.meta
  pagination.value.totalItems =
    meta?.totalItems ?? meta?.count ?? (Array.isArray(data) ? data.length : 0)
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
      const parsed = options.schema?.update ? options.schema.update.parse(payload) : payload
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

  // Pagination helpers
  function nextPage() {
    pagination.value.page += 1
  }

  function prevPage() {
    pagination.value.page = Math.max(1, pagination.value.page - 1)
  }

  // Auto-refresh on filters/page/lang changes is handled via useAsyncData watch: [listKey]
  // Consumers can still call fetchList() to force refresh if needed.

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

    // actions
    fetchList,
    fetchOne,
    create,
    update,
    remove,

    // helpers
    nextPage,
    prevPage,
  }
}
