// app/composables/manage/usePaginatedList.ts
import { computed, reactive, toRef, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'

export interface PaginationConfig {
  initialPage?: number
  initialPageSize?: number
  totalItems?: number
  pageSizeOptions?: number[]
}

export interface PaginatedList<TFilters extends Record<string, any>> {
  page: Ref<number>
  pageSize: Ref<number>
  totalItems: Ref<number>
  totalPages: ComputedRef<number>
  options: ComputedRef<number[]>
  setPage: (value: number) => void
  setPageSize: (value: number) => void
  resetPage: () => void
  filters: TFilters
  syncMeta: (meta?: { page?: number; pageSize?: number; totalItems?: number }) => void
  registerPageSizeOptions: (...values: number[]) => void
}

export function usePaginatedList<TFilters extends Record<string, any>>(
  filters: TFilters,
  config: PaginationConfig = {},
): PaginatedList<TFilters> {
  const state = reactive({
    page: config.initialPage ?? 1,
    pageSize: config.initialPageSize ?? 20,
    totalItems: config.totalItems ?? 0,
  })

  const baseOptions = reactive(new Set(config.pageSizeOptions ?? [10, 20, 50]))

  const options = computed(() => {
    const list = Array.from(baseOptions)
    return list.sort((a, b) => a - b)
  })

  const totalPages = computed(() => {
    const size = state.pageSize || 1
    return Math.max(1, Math.ceil((state.totalItems || 0) / size))
  })

  function setPage(value: number) {
    if (!Number.isFinite(value) || value <= 0) return
    const rounded = Math.floor(value)
    state.page = rounded <= 0 ? 1 : rounded
  }

  function setPageSize(value: number) {
    if (!Number.isFinite(value) || value <= 0) return
    const next = Math.floor(value)
    if (!baseOptions.has(next)) baseOptions.add(next)
    state.pageSize = next
    state.page = 1
  }

  function registerPageSizeOptions(...values: number[]) {
    for (const value of values) {
      if (!Number.isFinite(value) || value <= 0) continue
      baseOptions.add(Math.floor(value))
    }
  }

  function resetPage() {
    state.page = config.initialPage ?? 1
  }

  function syncMeta(meta?: { page?: number; pageSize?: number; totalItems?: number }) {
    if (!meta) return
    if (typeof meta.page === 'number' && Number.isFinite(meta.page)) {
      state.page = meta.page
    }
    if (typeof meta.pageSize === 'number' && Number.isFinite(meta.pageSize)) {
      state.pageSize = meta.pageSize
    }
    if (typeof meta.totalItems === 'number' && Number.isFinite(meta.totalItems)) {
      state.totalItems = meta.totalItems
    }
  }

  watch(
    () => state.pageSize,
    (value) => {
      if (value > 0 && !baseOptions.has(value)) {
        baseOptions.add(value)
      }
    },
    { immediate: true },
  )

  return {
    page: toRef(state, 'page'),
    pageSize: toRef(state, 'pageSize'),
    totalItems: toRef(state, 'totalItems'),
    totalPages,
    options,
    setPage,
    setPageSize,
    resetPage,
    filters,
    syncMeta,
    registerPageSizeOptions,
  }
}
