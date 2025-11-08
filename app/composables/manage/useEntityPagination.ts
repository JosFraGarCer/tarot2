import { computed } from 'vue'
import type { AnyManageCrud } from '@/types/manage'

function toOptions(values: number[]) {
  return values
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b)
    .map((value) => ({ label: String(value), value }))
}

export function useEntityPagination(crud: AnyManageCrud) {
  const pageSizeSource = (crud as any).pageSizeOptions
  const registerOptions = (crud as any).registerPageSizeOptions as ((...values: number[]) => void) | undefined

  const defaultPageSizes = computed(() => {
    const base = Array.isArray(pageSizeSource?.value) && pageSizeSource.value.length
      ? pageSizeSource!.value
      : [10, 20, 50]
    return toOptions(base)
  })

  const page = computed(() => crud.pagination.value.page ?? 1)
  const pageSize = computed(() => crud.pagination.value.pageSize ?? 20)
  const totalItems = computed(() => crud.pagination.value.totalItems ?? 0)
  const totalPages = computed(() => {
    const size = pageSize.value || 1
    return Math.max(1, Math.ceil(totalItems.value / size))
  })

  function onPageChange(value: number) {
    if (!Number.isFinite(value) || value <= 0) return
    const next = Math.floor(value)
    crud.pagination.value.page = next <= 0 ? 1 : next
  }

  function onPageSizeChange(value: number) {
    if (!Number.isFinite(value) || value <= 0) return
    const next = Math.floor(value)
    registerOptions?.(next)
    const pagination = crud.pagination.value
    pagination.pageSize = next
    pagination.page = 1
  }

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    defaultPageSizes,
    onPageChange,
    onPageSizeChange,
  }
}
