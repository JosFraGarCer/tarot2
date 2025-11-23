// app/composables/common/useListMeta.ts
import { reactive, readonly, watchEffect, toValue, type MaybeRefOrGetter } from 'vue'

export interface ListMeta { page: number; pageSize: number; totalItems: number; totalPages: number }

export interface ListMetaExtended extends ListMeta {
  hasNext: boolean
  hasPrev: boolean
}

export function toListMeta(
  input: Partial<ListMeta> | null | undefined,
  fallback: Partial<ListMeta> = {},
): ListMeta {
  const page = toPositiveNumber(input?.page, fallback.page, 1)
  const pageSize = toPositiveNumber(input?.pageSize, fallback.pageSize, 20)
  const totalItems = toFiniteNumber(input?.totalItems, fallback.totalItems, 0)
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalItems) / Math.max(1, pageSize)))
  return { page, pageSize, totalItems, totalPages }
}

export function useListMeta(
  meta: MaybeRefOrGetter<Partial<ListMeta> | null | undefined>,
  fallback: MaybeRefOrGetter<Partial<ListMeta>> = {},
) {
  const state = reactive<ListMetaExtended>({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  })

  watchEffect(() => {
    const normalized = toListMeta(toValue(meta), toValue(fallback) ?? {})
    state.page = normalized.page
    state.pageSize = normalized.pageSize
    state.totalItems = normalized.totalItems
    state.totalPages = normalized.totalPages
    state.hasNext = normalized.page < normalized.totalPages
    state.hasPrev = normalized.page > 1
  })

  return readonly(state)
}

function toPositiveNumber(value: unknown, fallback: unknown, defaultValue: number): number {
  const resolved = toFiniteNumber(value, fallback, defaultValue)
  return resolved > 0 ? resolved : defaultValue
}

function toFiniteNumber(value: unknown, fallback: unknown, defaultValue: number): number {
  const candidate = Number(value ?? fallback ?? defaultValue)
  return Number.isFinite(candidate) ? candidate : defaultValue
}
