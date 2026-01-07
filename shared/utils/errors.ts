// shared/utils/errors.ts
import type { ApiFail } from '../types/api'

export class ApiError extends Error {
  statusCode: number
  data?: unknown

  constructor(message: string, statusCode = 500, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.data = data
  }

  toJSON(): ApiFail {
    return {
      success: false,
      error: {
        message: this.message,
        statusCode: this.statusCode,
        data: this.data
      }
    }
  }
}

/**
 * Normalizes any error into a standard ApiFail structure.
 */
export function normalizeError(err: unknown): ApiFail {
  if (err instanceof ApiError) return err.toJSON()
  
  const message = err instanceof Error ? err.message : String(err)
  const statusCode = (err as any)?.statusCode || (err as any)?.status || 500
  
  return {
    success: false,
    error: {
      message,
      statusCode,
      data: (err as any)?.data
    }
  }
}
