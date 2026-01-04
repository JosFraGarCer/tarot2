// app/utils/error.ts

/**
 * API error response structure from server
 */
export interface ApiErrorResponse {
  data?: {
    message?: string
    statusCode?: number
    statusMessage?: string
  }
  message?: string
  statusCode?: number
  statusMessage?: string
}

/**
 * Extract a human-readable error message from various error types.
 * Handles API errors, Error objects, and unknown values.
 *
 * @param err - The error to extract a message from
 * @param fallback - Optional fallback message if extraction fails
 * @returns A string error message
 */
export function getErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  if (!err) return fallback

  // Handle API error responses (from $fetch/useFetch)
  if (typeof err === 'object' && err !== null) {
    const apiErr = err as ApiErrorResponse

    // Check nested data.message first (common in API responses)
    if (apiErr.data?.message) {
      return apiErr.data.message
    }

    // Check direct message property
    if (apiErr.message) {
      return apiErr.message
    }

    // Check statusMessage
    if (apiErr.data?.statusMessage) {
      return apiErr.data.statusMessage
    }
    if (apiErr.statusMessage) {
      return apiErr.statusMessage
    }

    // Handle standard Error objects
    if (err instanceof Error) {
      return err.message
    }
  }

  // Handle string errors
  if (typeof err === 'string') {
    return err
  }

  // Fallback to string conversion
  return String(err) || fallback
}

/**
 * Type guard to check if an error has a specific status code
 */
export function hasStatusCode(err: unknown, code: number): boolean {
  if (!err || typeof err !== 'object') return false
  const apiErr = err as ApiErrorResponse
  return apiErr.statusCode === code || apiErr.data?.statusCode === code
}

/**
 * Check if error is a 404 Not Found
 */
export function isNotFoundError(err: unknown): boolean {
  return hasStatusCode(err, 404)
}

/**
 * Check if error is a 401 Unauthorized
 */
export function isUnauthorizedError(err: unknown): boolean {
  return hasStatusCode(err, 401)
}

/**
 * Check if error is a 403 Forbidden
 */
export function isForbiddenError(err: unknown): boolean {
  return hasStatusCode(err, 403)
}
