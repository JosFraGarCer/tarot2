// app/composables/manage/useEntityNormalization.ts
// Normalization utilities for API responses
// Separated from useEntity.ts to reduce file size and improve maintainability

export interface ApiMeta {
  page?: number
  pageSize?: number
  totalItems?: number
  count?: number
  search?: string
}

export interface NormalizedListResponse<TItem> {
  items: TItem[]
  meta?: ApiMeta & Record<string, unknown>
  totalItems: number
}

type UnknownRecord = Record<string, unknown>

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : undefined
}

function normalizeMeta(metaCandidate: unknown): ApiMeta & UnknownRecord | undefined {
  if (!metaCandidate || typeof metaCandidate !== 'object') return undefined
  const meta: ApiMeta & UnknownRecord = { ...(metaCandidate as UnknownRecord) }

  const page = toNumber(
    (metaCandidate as UnknownRecord).page ??
    (metaCandidate as UnknownRecord).page_number ??
    (metaCandidate as UnknownRecord).current_page ??
    (metaCandidate as UnknownRecord).pageNumber ??
    (metaCandidate as UnknownRecord).currentPage
  )
  if (page !== undefined) meta.page = page

  const pageSize = toNumber(
    (metaCandidate as UnknownRecord).pageSize ??
    (metaCandidate as UnknownRecord).page_size ??
    (metaCandidate as UnknownRecord).per_page ??
    (metaCandidate as UnknownRecord).perPage ??
    (metaCandidate as UnknownRecord).limit
  )
  if (pageSize !== undefined) meta.pageSize = pageSize

  const totalItems = toNumber(
    (metaCandidate as UnknownRecord).totalItems ??
    (metaCandidate as UnknownRecord).total ??
    (metaCandidate as UnknownRecord).total_count ??
    (metaCandidate as UnknownRecord).totalResults ??
    (metaCandidate as UnknownRecord).total_records ??
    (metaCandidate as UnknownRecord).count
  )
  if (totalItems !== undefined) meta.totalItems = totalItems

  const count = toNumber((metaCandidate as UnknownRecord).count)
  if (count !== undefined) meta.count = count

  return meta
}

export function normalizeListResponse<TItem>(raw: unknown): NormalizedListResponse<TItem> {
  if (!raw) {
    return { items: [], totalItems: 0 }
  }

  if (Array.isArray(raw)) {
    return { items: raw as TItem[], totalItems: raw.length }
  }

  const containers = [
    raw,
    (raw as UnknownRecord).data,
    (raw as UnknownRecord).payload,
    (raw as UnknownRecord).body,
    (raw as UnknownRecord).result,
  ]
  let items: TItem[] = []

  for (const container of containers) {
    if (!container) continue
    if (Array.isArray(container)) {
      items = container as TItem[]
      break
    }
    for (const key of ['data', 'results', 'items', 'rows', 'list', 'records']) {
      const candidate = (container as UnknownRecord)?.[key]
      if (Array.isArray(candidate)) {
        items = candidate as TItem[]
        break
      }
    }
    if (items.length) break
  }

  const metaCandidates = [
    (raw as UnknownRecord).meta,
    (raw as UnknownRecord).pagination,
    (raw as UnknownRecord).pageInfo,
    (raw as UnknownRecord).metaData,
    (raw as UnknownRecord).meta_data,
    (raw as UnknownRecord).paging,
    (raw as UnknownRecord).data?.meta,
    (raw as UnknownRecord).data?.pagination,
    (raw as UnknownRecord).payload?.meta,
  ].filter(Boolean)

  let meta: ApiMeta & UnknownRecord | undefined
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
    (raw as UnknownRecord).totalItems,
    (raw as UnknownRecord).total,
    (raw as UnknownRecord).count,
    (raw as UnknownRecord).total_count,
    (raw as UnknownRecord).size,
    (raw as UnknownRecord).data?.total,
    (raw as UnknownRecord).data?.count,
    (raw as UnknownRecord).data?.total_count,
    (raw as UnknownRecord).pagination?.total,
    (raw as UnknownRecord).pagination?.totalItems,
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
    const coercedPage = toNumber(meta.page ?? (raw as UnknownRecord).page ?? (raw as UnknownRecord).currentPage)
    if (coercedPage !== undefined) meta.page = coercedPage
    const coercedPageSize = toNumber(meta.pageSize ?? (raw as UnknownRecord).pageSize ?? (raw as UnknownRecord).perPage)
    if (coercedPageSize !== undefined) meta.pageSize = coercedPageSize
  }

  return { items, meta, totalItems }
}
