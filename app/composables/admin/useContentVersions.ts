// app/composables/admin/useContentVersions.ts
import { defu } from 'defu'
import { useApiFetch } from '@/utils/fetcher'
import { toListMeta } from '@/composables/common/useListMeta'

export interface ContentVersion {
  id: number
  version_semver: string
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  created_by: number | null
  created_by_name?: string | null
  release: ReleaseStage
}

export interface ContentVersionMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  search?: string | null
}

export interface ContentVersionQuery {
  search?: string
  status?: 'all' | 'draft' | 'published'
  page?: number
  pageSize?: number
  sort?: 'created_at' | 'version_semver'
  direction?: 'asc' | 'desc'
  version_semver?: string
  created_by?: number
  release?: ReleaseStage
}

export interface SavePayload {
  version_semver: string
  description?: string | null
  metadata?: Record<string, unknown>
  release: ReleaseStage
}

export type ReleaseStage = 'dev' | 'alfa' | 'beta' | 'candidate' | 'release' | 'revision'

export function useContentVersions() {
  const apiFetch = useApiFetch

  const items = ref<ContentVersion[]>([])
  const pending = ref(false)
  const error = ref<unknown>(null)
  const meta = ref<ContentVersionMeta>({ page: 1, pageSize: 20, totalItems: 0, totalPages: 1, search: null })
  const lastQuery = ref<ContentVersionQuery>({ page: 1, pageSize: 20, status: 'all' })

  function normalizeQuery(query: ContentVersionQuery = {}) {
    return defu(query, { page: 1, pageSize: 20, status: 'all' as const })
  }

  function buildParams(query: ContentVersionQuery) {
    const params: Record<string, unknown> = {
      page: query.page,
      pageSize: query.pageSize,
    }

    if (query.search) params.search = query.search
    if (query.version_semver) params.version_semver = query.version_semver
    if (query.created_by != null) params.created_by = query.created_by
    if (query.sort) params.sort = query.sort
    if (query.direction) params.direction = query.direction
    if (query.status && query.status !== 'all') params.status = query.status
    if (query.release) params.release = query.release

    return params
  }

  async function fetchList(query: ContentVersionQuery = {}) {
    const normalized = normalizeQuery(query)
    lastQuery.value = normalized
    pending.value = true
    error.value = null

    try {
      const response = await apiFetch<{ data: ContentVersion[]; meta?: ContentVersionMeta }>('/content_versions', {
        method: 'GET',
        params: buildParams(normalized),
      })

      const payload = Array.isArray(response) ? { data: response as ContentVersion[], meta: undefined } : response
      const list = Array.isArray(payload?.data) ? payload!.data : []

      items.value = list
      const normalizedMeta = toListMeta(payload?.meta, {
        page: normalized.page,
        pageSize: normalized.pageSize,
        totalItems: list.length,
      })
      meta.value = {
        ...payload?.meta,
        ...normalizedMeta,
        search: payload?.meta?.search ?? normalized.search ?? null,
      }
      return list
    } catch (err) {
      error.value = err
      throw err
    } finally {
      pending.value = false
    }
  }

  async function fetchOne(id: number) {
    return await apiFetch<ContentVersion>(`/content_versions/${id}`, { method: 'GET' })
  }

  async function create(payload: SavePayload) {
    const result = await apiFetch<ContentVersion>('/content_versions', {
      method: 'POST',
      body: payload,
    })
    await fetchList(lastQuery.value)
    return result
  }

  async function update(id: number, payload: Partial<SavePayload>) {
    const result = await apiFetch<ContentVersion>(`/content_versions/${id}`, {
      method: 'PATCH',
      body: payload,
    })
    await fetchList(lastQuery.value)
    return result
  }

  async function remove(id: number) {
    await apiFetch(`/content_versions/${id}`, { method: 'DELETE' })
    await fetchList(lastQuery.value)
  }

  async function publish(options: { id?: number; version_semver?: string; notes?: string | null }) {
    const result = await apiFetch<{ data: unknown }>(`/content_versions/publish`, {
      method: 'POST',
      body: options,
    })
    await fetchList(lastQuery.value)
    return result?.data ?? result
  }

  return {
    items,
    pending,
    error,
    meta,
    lastQuery,
    fetchList,
    fetchOne,
    create,
    update,
    remove,
    publish,
  }
}
