// app/composables/manage/useEntityPagination.ts
import { computed, toValue } from 'vue'
import type { AnyManageCrud } from '@/types/manage'

function _toOptions(values: number[]) {
  if (!Array.isArray(values)) return []
  return values
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b)
    .map((value) => ({ label: String(value), value }))
}

export function useEntityPagination(crud: AnyManageCrud) {
  const page = computed(() => crud.pagination.value.page)
  const pageSize = computed(() => crud.pagination.value.pageSize)
  const totalItems = computed(() => crud.pagination.value.totalItems)
  
  const totalPages = computed(() => {
    const size = pageSize.value || 1
    return Math.max(1, Math.ceil((totalItems.value || 0) / size))
  })

  const defaultPageSizes = computed(() => _toOptions(toValue(crud.pageSizeOptions)))

  function onPageChange(newPage: number) {
    crud.pagination.value.page = newPage
  }

  function onPageSizeChange(newPageSize: number) {
    crud.pagination.value.pageSize = newPageSize
    crud.pagination.value.page = 1 // Reset to page 1 when page size changes
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
