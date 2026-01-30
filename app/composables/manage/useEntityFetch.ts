// app/composables/manage/useEntityFetch.ts
// Network utilities for entity operations - extracted from useEntity.ts

import type { Ref } from 'vue'
import { useApiFetch } from '~/utils/fetcher'

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: Record<string, unknown>
}

export interface ApiMeta {
  page?: number
  pageSize?: number
  totalItems?: number
  count?: number
  search?: string
}

export interface PaginationState {
  page: number
  pageSize: number
  totalItems: number
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export function createEntityFetcher<T>(
  resourcePath: string,
  lang: Ref<string>,
  includeLangParam = true
) {
  async function fetchOne(id: string | number): Promise<T | null> {
    const params = includeLangParam ? { lang: lang.value } : undefined
    const res = await useApiFetch<ApiResponse<T>>(`${resourcePath}/${id}`, {
      method: 'GET',
      params,
    })
    if (res?.success === false) throw new Error('Request failed')
    return res?.data ?? null
  }

  async function create(payload: unknown, createLang?: string): Promise<T> {
    const params = includeLangParam ? { lang: lang.value } : undefined
    const bodyPayload = createLang !== undefined
      ? { lang: createLang, ...(payload as object) }
      : (payload as object)

    const res = await useApiFetch<ApiResponse<T>>(resourcePath, {
      method: 'POST',
      params,
      body: bodyPayload as object,
    })
    if (res?.success === false) throw new Error('Request failed')
    return res.data
  }

  async function update(id: string | number, payload: unknown): Promise<T> {
    const params = includeLangParam ? { lang: lang.value } : undefined
    const res = await useApiFetch<ApiResponse<T>>(`${resourcePath}/${id}`, {
      method: 'PATCH',
      params,
      body: payload,
    })
    if (res?.success === false) throw new Error('Request failed')
    return res.data
  }

  async function remove(id: string | number): Promise<boolean> {
    const params = includeLangParam ? { lang: lang.value } : undefined
    const res = await useApiFetch<ApiResponse<null>>(`${resourcePath}/${id}`, {
      method: 'DELETE',
      params,
    })
    if (res?.success === false) throw new Error('Request failed')
    return true
  }

  async function updateStatus(id: string | number, nextStatus: unknown): Promise<T> {
    return update(id, { status: nextStatus })
  }

  async function updateTags(id: string | number, tagIds: number[]): Promise<T> {
    const res = await useApiFetch<ApiResponse<T>>(`${resourcePath}/${id}`, {
      method: 'PATCH',
      params: includeLangParam ? { lang: lang.value } : undefined,
      body: { tag_ids: tagIds },
    })
    if (res?.success === false) throw new Error('Request failed')
    return res.data
  }

  return {
    fetchOne,
    create,
    update,
    remove,
    updateStatus,
    updateTags,
  }
}

export function normalizeFilters(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'search' && typeof value !== 'string') continue
    if (value === '' || value === null || value === undefined || value === 'all') continue
    if (Array.isArray(value) && value.length === 0) continue
    if (key === 'is_active' && value === true) continue
    if (key === 'is_active') {
      if (value === false) {
        out[key] = 'false'
      } else if (typeof value === 'boolean') {
        out[key] = value ? 'true' : 'false'
      } else if (value === 'true' || value === 'false') {
        out[key] = value
      } else if (value !== undefined && value !== null) {
        out[key] = value
      }
      continue
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const [subKey, subValue] of Object.entries(value)) {
        if (subValue !== null && subValue !== undefined && subValue !== '') {
          out[`${key}_${subKey}`] = subValue
        }
      }
      continue
    }
    out[key] = value
  }
  return out
}

export function pruneUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const k in obj) {
    const v = obj[k]
    if (v !== undefined) out[k] = v
  }
  return out as T
}

export function sanitizeInitialFilters(raw: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (value === true) {
      if (key.endsWith('_ids')) sanitized[key] = []
      else sanitized[key] = true
      continue
    }
    sanitized[key] = value
  }
  return sanitized
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : undefined
}

export function normalizeMeta(metaCandidate: unknown): Record<string, unknown> | undefined {
  if (!metaCandidate || typeof metaCandidate !== 'object') return undefined
  const meta: Record<string, unknown> = { ...(metaCandidate as Record<string, unknown>) }

  const page = toNumber(
    (metaCandidate as Record<string, unknown>)?.page ??
    (metaCandidate as Record<string, unknown>)?.page_number ??
    (metaCandidate as Record<string, unknown>)?.current_page ??
    (metaCandidate as Record<string, unknown>)?.pageNumber ??
    (metaCandidate as Record<string, unknown>)?.currentPage
  )
  if (page !== undefined) meta.page = page

  const pageSize = toNumber(
    (metaCandidate as Record<string, unknown>)?.pageSize ??
    (metaCandidate as Record<string, unknown>)?.page_size ??
    (metaCandidate as Record<string, unknown>)?.per_page ??
    (metaCandidate as Record<string, unknown>)?.perPage ??
    (metaCandidate as Record<string, unknown>)?.limit
  )
  if (pageSize !== undefined) meta.pageSize = pageSize

  const totalItems = toNumber(
    (metaCandidate as Record<string, unknown>)?.totalItems ??
    (metaCandidate as Record<string, unknown>)?.total ??
    (metaCandidate as Record<string, unknown>)?.total_count ??
    (metaCandidate as Record<string, unknown>)?.totalResults ??
    (metaCandidate as Record<string, unknown>)?.total_records ??
    (metaCandidate as Record<string, unknown>)?.count
  )
  if (totalItems !== undefined) meta.totalItems = totalItems

  const count = toNumber(metaCandidate)
  if (count !== undefined) meta.count = count

  return meta
}

export interface NormalizedListResponse<TItem> {
  items: TItem[]
  meta?: Record<string, unknown>
  totalItems: number
}

export function normalizeListResponse<TItem>(raw: unknown): NormalizedListResponse<TItem> {
  if (!raw) {
    return { items: [], totalItems: 0 }
  }

  if (Array.isArray(raw)) {
    return { items: raw as TItem[], totalItems: raw.length }
  }

  const rawObj = raw as Record<string, unknown>
  const containers = [raw, rawObj?.data, rawObj?.payload, rawObj?.body, rawObj?.result]
  let items: TItem[] = []

  for (const container of containers) {
    if (!container) continue
    if (Array.isArray(container)) {
      items = container as TItem[]
      break
    }
    const containerObj = container as Record<string, unknown>
    for (const key of ['data', 'results', 'items', 'rows', 'list', 'records']) {
      const candidate = containerObj?.[key]
      if (Array.isArray(candidate)) {
        items = candidate as TItem[]
        break
      }
    }
    if (items.length) break
  }

  const metaCandidates = [
    rawObj?.meta,
    rawObj?.pagination,
    rawObj?.pageInfo,
    rawObj?.metaData,
    rawObj?.meta_data,
    rawObj?.paging,
    rawObj?.data?.meta,
    rawObj?.data?.pagination,
    rawObj?.payload?.meta,
  ].filter(Boolean)

  let meta: Record<string, unknown> | undefined
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

  const totalCandidates: Array<unknown> = [
    meta?.totalItems,
    meta?.total,
    meta?.count,
    rawObj?.totalItems,
    rawObj?.total,
    rawObj?.count,
    rawObj?.total_count,
    rawObj?.size,
    rawObj?.data?.total,
    rawObj?.data?.count,
    rawObj?.data?.total_count,
    rawObj?.pagination?.total,
    rawObj?.pagination?.totalItems,
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
    const coercedPage = toNumber(rawObj?.page ?? rawObj?.currentPage)
    if (coercedPage !== undefined) meta.page = coercedPage
    const coercedPageSize = toNumber(rawObj?.pageSize ?? rawObj?.perPage)
    if (coercedPageSize !== undefined) meta.pageSize = coercedPageSize
  }

  return { items, meta, totalItems }
}
