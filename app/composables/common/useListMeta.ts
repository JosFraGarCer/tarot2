// app/composables/common/useListMeta.ts

export interface ListMeta { page: number; pageSize: number; totalItems: number; totalPages: number }

export function toListMeta(input: Partial<ListMeta> | null | undefined, fallback: { page?: number; pageSize?: number; totalItems?: number } = {}): ListMeta {
  const page = Number.isFinite(input?.page) && (input!.page as number) > 0 ? (input!.page as number) : (fallback.page || 1)
  const pageSize = Number.isFinite(input?.pageSize) && (input!.pageSize as number) > 0 ? (input!.pageSize as number) : (fallback.pageSize || 20)
  const totalItems = Number.isFinite(input?.totalItems) ? (input!.totalItems as number) : (fallback.totalItems || 0)
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalItems) / Math.max(1, pageSize)))
  return { page, pageSize, totalItems, totalPages }
}
