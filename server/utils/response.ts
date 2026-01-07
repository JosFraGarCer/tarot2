// server/utils/response.ts
import { normalizeError } from '../../shared/utils/errors'
import { pruneUndefined } from '../../shared/utils/validation'
import type { ApiMeta, ApiResponse } from '../../shared/types/api'
import { markLanguageFallback } from './language'

export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

export function fail(message: string, statusCode = 400): ApiResponse<never> {
  return normalizeError({ message, statusCode })
}

export type Meta = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  count: number
  search: string | null
}

export function withMeta<T extends Record<string, any>>(data: T[], totalItems: number, page: number, pageSize: number, search?: string | null): ApiResponse<T[]> {
  const totalPages = Math.ceil(totalItems / pageSize)
  return createResponse(data, {
    page,
    pageSize,
    totalItems,
    totalPages,
    count: data.length,
    search: search ?? null,
  })
}

// Universal serializer helpers
export function createResponse<T>(data: T, meta?: ApiMeta | null): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: meta ?? null,
  }
}

export function createErrorResponse(message: string, statusCode = 400): ApiResponse<never> {
  return normalizeError({ message, statusCode })
}

interface PaginatedResponseOptions {
  search?: string | null
  lang?: string | null
  extraMeta?: Record<string, unknown>
}

export function createPaginatedResponse<T extends Record<string, any>>(
  data: T[],
  totalItems: number,
  page: number,
  pageSize: number,
  options: PaginatedResponseOptions | string | null = null,
): ApiResponse<T[]> {
  let search: string | null | undefined = null
  let lang: string | null | undefined
  let extraMeta: Record<string, unknown> | undefined

  if (typeof options === 'string' || options === null) {
    search = options ?? null
  } else if (options && typeof options === 'object') {
    search = options.search ?? null
    lang = options.lang ?? null
    extraMeta = options.extraMeta
  }

  const normalizedData = (lang ? markLanguageFallback(data as any, lang) : data) as T[]
  const totalPages = Math.ceil(totalItems / pageSize)
  return createResponse(normalizedData, {
    page,
    pageSize,
    totalItems,
    totalPages,
    count: normalizedData.length,
    search: search ?? null,
    ...(lang ? { lang } : {}),
    ...(extraMeta ?? {}),
  })
}
