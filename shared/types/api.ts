// shared/types/api.ts
/**
 * Shared API Types for Nuxt 5 / Future compatibility.
 * Defines the contract between server and app.
 */

export interface ApiMeta {
  page?: number
  pageSize?: number
  totalItems?: number
  totalPages?: number
  count?: number
  search?: string | null
  lang?: string | null
  [key: string]: unknown
}

export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: ApiMeta | null
}

export interface ApiFail {
  success: false
  error: {
    message: string
    statusCode: number
    data?: unknown
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFail
