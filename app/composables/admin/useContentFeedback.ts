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

export function useContentFeedback() {
  const apiFetch = useApiFetch
  const { locale } = useI18n()
  const toast = useToast?.()

  const resolvedLocale = computed(() => (typeof locale === 'string' ? locale : locale.value))

  const items = ref<FeedbackItem[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<FeedbackMeta>({ page: 1, pageSize: 20, totalItems: 0 })
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
      meta.value = response?.meta ?? {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: response?.meta?.totalItems ?? list.length,
      }
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
      const response = await apiFetch<{ success?: boolean; data: FeedbackItem }>(`/api/content_feedback/${id}`, {
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
