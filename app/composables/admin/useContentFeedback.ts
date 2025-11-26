// app/composables/admin/useContentFeedback.ts
import { computed, ref } from 'vue'
import { useI18n, useToast } from '#imports'
import { useApiFetch } from '@/utils/fetcher'

interface FeedbackItem {
  id: number
  entity_type: string
  entity_id: number
  version_number: number | null
  language_code: string | null
  comment: string
  category: string | null
  status: 'open' | 'resolved' | string
  created_by: number | null
  resolved_by: number | null
  created_at: string
  resolved_at: string | null
  detail?: string | null
  [key: string]: any
}

interface FeedbackMeta {
  page?: number
  pageSize?: number
  totalItems?: number
  totalPages?: number
  [key: string]: any
}

type FeedbackQuery = {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  category?: string
  entity_type?: string
  entity_id?: number
  created_by?: number
  resolved_by?: number
  language_code?: string
  has_resolution?: boolean
  created_from?: string | Date
  created_to?: string | Date
  resolved_from?: string | Date
  resolved_to?: string | Date
  version_number?: number | null
  type?: string // legacy compatibility – maps to category
}

type FeedbackUpdatePayload = Partial<{
  comment: string
  category: string | null
  status: string
  detail: string | null
  resolved_by: number | null
  resolved_at: string | null
  version_number: number | null
  language_code: string | null
}>

function resolvePage(value: unknown, fallback: number) {
  const base = Number.isFinite(fallback) && fallback > 0 ? fallback : 1
  const num = typeof value === 'number' && Number.isFinite(value) ? value : base
  return Math.max(1, Math.floor(num))
}

function resolvePageSize(value: unknown, fallback: number) {
  const base = Number.isFinite(fallback) && fallback > 0 ? fallback : 20
  const num = typeof value === 'number' && Number.isFinite(value) ? value : base
  return Math.max(1, Math.floor(num))
}

function resolveTotalItems(value: unknown, fallback: number) {
  const base = Number.isFinite(fallback) ? fallback : 0
  const num = typeof value === 'number' && Number.isFinite(value) ? value : base
  return Math.max(0, Math.floor(num))
}

function resolveTotalPages(value: unknown, fallback: number) {
  const base = Number.isFinite(fallback) && fallback > 0 ? fallback : 1
  const num = typeof value === 'number' && Number.isFinite(value) ? value : base
  return Math.max(1, Math.floor(num))
}

function computeTotalPages(totalItems: number, pageSize: number) {
  const safeSize = Math.max(1, pageSize)
  const safeTotal = Math.max(0, totalItems)
  return Math.max(1, Math.ceil(safeTotal / safeSize))
}

function normalizeMeta(
  rawMeta: FeedbackMeta | null | undefined,
  fallback: { page?: number; pageSize?: number; totalItems?: number } = {},
): FeedbackMeta {
  const fallbackPage = Number.isFinite(fallback.page) && (fallback.page as number) > 0 ? (fallback.page as number) : 1
  const fallbackPageSize = Number.isFinite(fallback.pageSize) && (fallback.pageSize as number) > 0 ? (fallback.pageSize as number) : 20
  const fallbackTotalItems = Number.isFinite(fallback.totalItems) ? (fallback.totalItems as number) : (rawMeta?.totalItems ?? 0)

  const page = resolvePage(rawMeta?.page, fallbackPage)
  const pageSize = resolvePageSize(rawMeta?.pageSize, fallbackPageSize)
  const totalItems = resolveTotalItems(rawMeta?.totalItems, fallbackTotalItems)
  const computedTotalPages = computeTotalPages(totalItems, pageSize)
  const totalPages = resolveTotalPages(rawMeta?.totalPages, computedTotalPages)

  return {
    ...(rawMeta ?? {}),
    page,
    pageSize,
    totalItems,
    totalPages,
  }
}

export function useContentFeedback() {
  const apiFetch = useApiFetch
  const { locale } = useI18n()
  const toast = useToast?.()

  const resolvedLocale = computed(() => (typeof locale === 'string' ? locale : locale.value))

  const items = ref<FeedbackItem[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<FeedbackMeta>(normalizeMeta(undefined, { page: 1, pageSize: 20, totalItems: 0 }))
  const lastQuery = ref<FeedbackQuery>({ page: 1, pageSize: 20 })

  function buildParams(query: FeedbackQuery = {}, track = true) {
    const nextPage = query.page ?? lastQuery.value.page ?? 1
    const nextPageSize = query.pageSize ?? lastQuery.value.pageSize ?? 20
    const params: Record<string, any> = {
      page: nextPage,
      pageSize: nextPageSize,
      lang: resolvedLocale.value,
    }

    const normalized: FeedbackQuery = { page: nextPage, pageSize: nextPageSize }

    const normalizeDate = (value?: string | Date | null) => {
      if (!value) return undefined
      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) return undefined
      return date.toISOString()
    }

    const status = query.status ?? lastQuery.value.status
    if (status && status !== 'all') {
      params.status = status
      normalized.status = status
    }

    const category = query.category ?? query.type ?? lastQuery.value.category ?? lastQuery.value.type
    if (category && category !== 'all') {
      params.category = category
      normalized.category = category
    }

    const search = query.search ?? lastQuery.value.search
    if (search) {
      params.search = search
      normalized.search = search
    }

    const entityType = query.entity_type ?? lastQuery.value.entity_type
    if (entityType) {
      params.entity_type = entityType
      normalized.entity_type = entityType
    }

    const entityId = query.entity_id ?? lastQuery.value.entity_id
    if (entityId !== undefined) {
      params.entity_id = entityId
      normalized.entity_id = entityId
    }

    const createdBy = query.created_by ?? lastQuery.value.created_by
    if (createdBy !== undefined) {
      params.created_by = createdBy
      normalized.created_by = createdBy
    }

    const resolvedBy = query.resolved_by ?? lastQuery.value.resolved_by
    if (resolvedBy !== undefined) {
      params.resolved_by = resolvedBy
      normalized.resolved_by = resolvedBy
    }

    const languageCode = query.language_code ?? lastQuery.value.language_code
    if (languageCode) {
      params.language_code = languageCode
      normalized.language_code = languageCode
    }

    const hasResolution = query.has_resolution ?? lastQuery.value.has_resolution
    if (typeof hasResolution === 'boolean') {
      params.has_resolution = hasResolution
      normalized.has_resolution = hasResolution
    }

    const createdFrom = query.created_from ?? lastQuery.value.created_from
    const createdTo = query.created_to ?? lastQuery.value.created_to
    const normalizedCreatedFrom = normalizeDate(createdFrom)
    const normalizedCreatedTo = normalizeDate(createdTo)
    if (normalizedCreatedFrom) {
      params.created_from = normalizedCreatedFrom
      normalized.created_from = normalizedCreatedFrom
    }
    if (normalizedCreatedTo) {
      params.created_to = normalizedCreatedTo
      normalized.created_to = normalizedCreatedTo
    }

    const resolvedFrom = query.resolved_from ?? lastQuery.value.resolved_from
    const resolvedTo = query.resolved_to ?? lastQuery.value.resolved_to
    const normalizedResolvedFrom = normalizeDate(resolvedFrom)
    const normalizedResolvedTo = normalizeDate(resolvedTo)
    if (normalizedResolvedFrom) {
      params.resolved_from = normalizedResolvedFrom
      normalized.resolved_from = normalizedResolvedFrom
    }
    if (normalizedResolvedTo) {
      params.resolved_to = normalizedResolvedTo
      normalized.resolved_to = normalizedResolvedTo
    }

    if (query.version_number !== undefined) {
      params.version_number = query.version_number
      normalized.version_number = query.version_number
    } else if (lastQuery.value.version_number !== undefined && query.version_number !== null) {
      params.version_number = lastQuery.value.version_number
      normalized.version_number = lastQuery.value.version_number
    }

    if (track) {
      lastQuery.value = normalized
    }

    return params
  }

  async function fetchList(query: FeedbackQuery = {}) {
    pending.value = true
    error.value = null
    const params = buildParams(query, true)

    try {
      const response = await apiFetch<{ success?: boolean; data: FeedbackItem[]; meta?: FeedbackMeta }>('/content_feedback', {
        method: 'GET',
        params,
      })
      const list = Array.isArray(response?.data) ? response.data : []
      items.value = list
      const normalizedMeta = normalizeMeta(response?.meta, {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: list.length,
      })
      meta.value = normalizedMeta
      return list
    } catch (err: any) {
      const message = err?.data?.message ?? err?.message ?? String(err)
      error.value = message
      toast?.add?.({ title: 'Error', description: message, color: 'error' })
      throw err
    } finally {
      pending.value = false
    }
  }

  async function fetchMeta(query: FeedbackQuery = {}) {
    const params = buildParams(query, false)
    try {
      const response = await apiFetch<{ success?: boolean; data: FeedbackItem[]; meta?: FeedbackMeta }>('/content_feedback', {
        method: 'GET',
        params,
      })
      return response?.meta ?? null
    } catch (err) {
      const message = (err as any)?.data?.message ?? (err as any)?.message ?? String(err)
      toast?.add?.({ title: 'Error', description: message, color: 'error' })
      throw err
    }
  }

  async function fetchOne(id: number) {
    try {
      const response = await apiFetch<{ success?: boolean; data: FeedbackItem }>(`/content_feedback/${id}`, {
        method: 'GET',
      })
      return response?.data ?? null
    } catch (err) {
      const message = (err as any)?.data?.message ?? (err as any)?.message ?? String(err)
      toast?.add?.({ title: 'Error', description: message, color: 'error' })
      throw err
    }
  }

  async function resolve(id: number, resolvedBy?: number | null) {
    const body: FeedbackUpdatePayload = {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    }
    if (resolvedBy !== undefined) body.resolved_by = resolvedBy
    await update(id, body)
  }

  async function reopen(id: number) {
    await update(id, { status: 'open', resolved_at: null, resolved_by: null })
  }

  async function update(id: number, payload: FeedbackUpdatePayload) {
    try {
      const response = await apiFetch<{ success?: boolean; data: FeedbackItem }>(`/content_feedback/${id}`, {
        method: 'PATCH',
        body: payload,
      })
      // optimistic update
      items.value = items.value.map((item) => (item.id === id ? { ...item, ...response?.data, ...payload } : item))
      return response?.data ?? null
    } catch (err) {
      const message = (err as any)?.data?.message ?? (err as any)?.message ?? String(err)
      toast?.add?.({ title: 'Error', description: message, color: 'error' })
      throw err
    }
  }

  async function remove(id: number) {
    try {
      await apiFetch(`/content_feedback/${id}`, {
        method: 'DELETE',
      })
      items.value = items.value.filter((item) => item.id !== id)
      if (typeof meta.value.totalItems === 'number') meta.value.totalItems = Math.max(0, meta.value.totalItems - 1)
    } catch (err) {
      const message = (err as any)?.data?.message ?? (err as any)?.message ?? String(err)
      toast?.add?.({ title: 'Error', description: message, color: 'error' })
      throw err
    }
  }

  async function refresh() {
    await fetchList(lastQuery.value)
  }

  const hasItems = computed(() => items.value.length > 0)

  return {
    items,
    pending,
    error,
    meta,
    hasItems,
    fetchList,
    fetchMeta,
    fetchOne,
    resolve,
    reopen,
    update,
    remove,
    refresh,
    lastQuery,
  }
}
