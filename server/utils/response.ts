// server/utils/response.ts
import { markLanguageFallback } from './language'

export type ApiSuccess<T> = { success: true; data: T }
export type ApiFail = { success: false; message: string }

export function success<T>(data: T): ApiSuccess<T> {
  return { success: true, data }
}

export function fail(message: string): ApiFail {
  return { success: false, message }
}

export type Meta = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  count: number
  search: string | null
}

export function withMeta<T>(data: T[], totalItems: number, page: number, pageSize: number, search?: string | null) {
  const totalPages = Math.ceil(totalItems / pageSize)
  return {
    success: true as const,
    data,
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages,
      count: data.length,
      search: search ?? null,
    },
  }
}

// Universal serializer helpers
export function createResponse<T>(data: T, meta?: Record<string, unknown> | null) {
  return {
    success: true as const,
    data,
    meta: meta ?? null,
  }
}

export function createErrorResponse(message: string, statusCode = 400) {
  return {
    success: false as const,
    error: {
      message,
      statusCode,
    },
  }
}

interface PaginatedResponseOptions {
  search?: string | null
  lang?: string | null
  extraMeta?: Record<string, unknown>
}

export function createPaginatedResponse<T>(
  data: T[],
  totalItems: number,
  page: number,
  pageSize: number,
  options: PaginatedResponseOptions | string | null = null,
) {
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

  const normalizedData = lang ? markLanguageFallback(data, lang) : data
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
