import { computed } from 'vue'
import type { AnyManageCrud } from '@/types/manage'

export function useEntityPagination(crud: AnyManageCrud) {
  const defaultPageSizes = computed(() => ([
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 }
  ]))

  const page = computed(() => crud.pagination.value.page ?? 1)
  const pageSize = computed(() => crud.pagination.value.pageSize ?? 20)
  const totalItems = computed(() => crud.pagination.value.totalItems ?? 0)
  const totalPages = computed(() => {
    const size = pageSize.value || 1
    return Math.max(1, Math.ceil(totalItems.value / size))
  })

  function onPageChange(value: number) {
    if (!Number.isFinite(value) || value <= 0) return
    crud.pagination.value.page = value
  }

  function onPageSizeChange(value: number) {
    if (!Number.isFinite(value) || value <= 0) return
    const pagination = crud.pagination.value
    pagination.pageSize = value
    pagination.page = 1
  }

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    defaultPageSizes,
    onPageChange,
    onPageSizeChange
  }
}
