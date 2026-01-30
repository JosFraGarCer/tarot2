// app/utils/apiError.ts
// Centralized API error handling with consistent client messages

export interface ApiErrorOptions {
  statusCode?: number
  message?: string
  code?: string
  details?: Record<string, unknown>
  cause?: unknown
}

export class ApiError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: Record<string, unknown>
  public readonly cause?: unknown

  override name = 'ApiError'

  constructor(options: ApiErrorOptions)
  constructor(message: string, statusCode?: number, code?: string)
  constructor(...args: [ApiErrorOptions | string] | [string, number?, string?]) {
    let opts: ApiErrorOptions
    if (typeof args[0] === 'string') {
      opts = {
        message: args[0],
        statusCode: args[1],
        code: args[2],
      }
    } else {
      opts = args[0]
    }

    const {
      statusCode = 500,
      message = 'An unexpected error occurred',
      code = 'INTERNAL_ERROR',
      details,
      cause,
    } = opts

    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.cause = cause

    Error.captureStackTrace(this, ApiError)
  }

  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: this.details,
      },
    }
  }

  static fromFetch(error: unknown, fallbackMessage = 'Request failed'): ApiError {
    if (error instanceof ApiError) {
      return error
    }

    const status = (error as any)?.status || (error as any)?.statusCode || (error as any)?.response?.status || 0
    const dataMessage = (error as any)?.data?.message || (error as any)?.data?.error?.message
    const message = dataMessage || (error as any)?.message || fallbackMessage

    if (status === 401) {
      return new ApiError({ statusCode: 401, message: 'Not authenticated', code: 'UNAUTHORIZED', cause: error })
    }

    if (status === 403) {
      return new ApiError({ statusCode: 403, message: 'Not allowed to perform this action', code: 'FORBIDDEN', cause: error })
    }

    if (status === 404) {
      return new ApiError({ statusCode: 404, message: 'Resource not found', code: 'NOT_FOUND', cause: error })
    }

    if (status === 422) {
      return new ApiError({
        statusCode: 422,
        message: dataMessage || 'Validation error',
        code: 'VALIDATION_ERROR',
        details: (error as any)?.data?.details || (error as any)?.data?.errors,
        cause: error,
      })
    }

    return new ApiError({
      statusCode: Number(status) || 500,
      message,
      code: 'REQUEST_FAILED',
      cause: error,
    })
  }

  static badRequest(message = 'Invalid request', details?: Record<string, unknown>): ApiError {
    return new ApiError({ statusCode: 400, message, code: 'BAD_REQUEST', details })
  }

  static unauthorized(message = 'Not authenticated'): ApiError {
    return new ApiError({ statusCode: 401, message, code: 'UNAUTHORIZED' })
  }

  static forbidden(message = 'Not allowed to perform this action'): ApiError {
    return new ApiError({ statusCode: 403, message, code: 'FORBIDDEN' })
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError({ statusCode: 404, message, code: 'NOT_FOUND' })
  }

  static validationError(message = 'Validation error', details?: Record<string, unknown>): ApiError {
    return new ApiError({ statusCode: 422, message, code: 'VALIDATION_ERROR', details })
  }

  static internalError(message = 'An unexpected error occurred'): ApiError {
    return new ApiError({ statusCode: 500, message, code: 'INTERNAL_ERROR' })
  }
}

export function toErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error'
  if (err instanceof ApiError) return err.message

  const status = (err as any)?.status || (err as any)?.statusCode || (err as any)?.response?.status

  if (status === 401 || status === 403) return 'Not allowed to perform this action.'
  if (status === 422) return (err as any)?.data?.message || 'Validation error'

  return (err as any)?.data?.message || (err as any)?.message || (typeof err === 'string' ? err : String(err))
}
