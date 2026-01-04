// app/composables/admin/useRevisions.ts
import { computed, ref } from 'vue'
import { useI18n, useToast } from '#imports'
import { useApiFetch } from '@/utils/fetcher'
import { getErrorMessage } from '@/utils/error'

export type RevisionStatus = 'draft' | 'approved' | 'rejected' | 'published' | string

export type RevisionItem = {
  id: number
  entity_type: string
  entity_id: number
  version_number: number
  status: RevisionStatus
  language_code: string | null
  content_version_id: number | null
  created_by: number | null
  created_at: string
  author_name?: string | null
  notes?: string | null
  diff?: Record<string, unknown>
  prev_snapshot?: Record<string, unknown>
  next_snapshot?: Record<string, unknown>
  [key: string]: unknown
}

export type RevisionMeta = {
  page?: number
  pageSize?: number
  totalItems?: number
  totalPages?: number
  [key: string]: unknown
}

export type RevisionQuery = {
  page?: number
  pageSize?: number
  search?: string
  entity_type?: string
  entity_id?: number
  version_number?: number
  status?: RevisionStatus
  language_code?: string
  content_version_id?: number
  created_by?: number
}

export function useRevisions() {
  const apiFetch = useApiFetch
  const { locale } = useI18n()
  const toast = useToast?.()

  const items = ref<RevisionItem[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)
  const meta = ref<RevisionMeta>({ page: 1, pageSize: 20, totalItems: 0 })
  const lastQuery = ref<RevisionQuery>({ page: 1, pageSize: 20 })

  const resolvedLocale = computed(() => (typeof locale === 'string' ? locale : locale.value))

  function buildParams(query: RevisionQuery = {}, track = true) {
    const nextPage = query.page ?? lastQuery.value.page ?? 1
    const nextPageSize = query.pageSize ?? lastQuery.value.pageSize ?? 20

    const params: Record<string, unknown> = {
      page: nextPage,
      pageSize: nextPageSize,
      lang: resolvedLocale.value,
    }

    const normalized: RevisionQuery = { page: nextPage, pageSize: nextPageSize }

    const search = query.search ?? lastQuery.value.search
    if (search) {
      params.search = search
      normalized.search = search
    }

    const status = query.status ?? lastQuery.value.status
    if (status) {
      params.status = status
      normalized.status = status
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

    const languageCode = query.language_code ?? lastQuery.value.language_code
    if (languageCode) {
      params.language_code = languageCode
      normalized.language_code = languageCode
    }

    const versionNumber = query.version_number ?? lastQuery.value.version_number
    if (versionNumber !== undefined) {
      params.version_number = versionNumber
      normalized.version_number = versionNumber
    }

    const contentVersionId = query.content_version_id ?? lastQuery.value.content_version_id
    if (contentVersionId !== undefined) {
      params.content_version_id = contentVersionId
      normalized.content_version_id = contentVersionId
    }

    const createdBy = query.created_by ?? lastQuery.value.created_by
    if (createdBy !== undefined) {
      params.created_by = createdBy
      normalized.created_by = createdBy
    }

    if (track) {
      lastQuery.value = normalized
    }

    return params
  }

  async function fetchList(query: RevisionQuery = {}) {
    pending.value = true
    error.value = null
    const params = buildParams(query, true)

    try {
      const response = await apiFetch<{ success?: boolean; data: RevisionItem[]; meta?: RevisionMeta }>('/content_revisions', {
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
    } catch (err: unknown) {
      const message = getErrorMessage(err)
      error.value = message
      toast?.add?.({ title: 'Error', description: message, color: 'error' })
      throw err
    } finally {
      pending.value = false
    }
  }

  async function fetchByEntity(entityType: string, entityId: number, language?: string) {
    const query: RevisionQuery = {
      entity_type: entityType,
      entity_id: entityId,
      page: 1,
      pageSize: lastQuery.value.pageSize ?? 20,
    }
    if (language) query.language_code = language
    return await fetchList(query)
  }

  async function fetchOne(id: number) {
    try {
      const response = await apiFetch<{ success?: boolean; data: RevisionItem }>(`/content_revisions/${id}`, {
        method: 'GET',
      })
      return response?.data ?? null
    } catch (err: unknown) {
      const message = getErrorMessage(err)
      toast?.add?.({ title: 'Error', description: message, color: 'error' })
      throw err
    }
  }

  async function setStatus(id: number, status: RevisionStatus) {
    await update(id, { status })
  }

  async function bulkSetStatus(ids: number[], status: RevisionStatus) {
    await Promise.all(ids.map((id) => setStatus(id, status)))
    await refresh()
  }

  async function update(id: number, payload: Partial<RevisionItem>) {
    try {
      const response = await apiFetch<{ success?: boolean; data: RevisionItem }>(`/content_revisions/${id}`, {
        method: 'PATCH',
        body: payload,
      })
      items.value = items.value.map((item) => (item.id === id ? { ...item, ...response?.data, ...payload } : item))
      return response?.data ?? null
    } catch (err: unknown) {
      const message = getErrorMessage(err)
      toast?.add?.({ title: 'Error', description: message, color: 'error' })
      throw err
    }
  }

  async function remove(id: number) {
    try {
      await apiFetch(`/content_revisions/${id}`, {
        method: 'DELETE',
      })
      items.value = items.value.filter((item) => item.id !== id)
      if (typeof meta.value.totalItems === 'number') meta.value.totalItems = Math.max(0, meta.value.totalItems - 1)
    } catch (err: unknown) {
      const message = getErrorMessage(err)
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
    fetchByEntity,
    fetchOne,
    setStatus,
    bulkSetStatus,
    update,
    remove,
    refresh,
    lastQuery,
  }
}
