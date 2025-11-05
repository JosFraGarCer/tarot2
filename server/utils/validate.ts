// server/utils/validate.ts
import { createError } from 'h3'
import type { ZodType } from 'zod'

export function safeParseOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    // Extract possible sort value without using 'any'
    const inputObj: Record<string, unknown> | null =
      typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : null
    const sortRaw = inputObj && 'sort' in inputObj ? inputObj['sort'] : undefined
    const sortValue = typeof sortRaw === 'string' ? sortRaw : undefined

    // Safely access parsed.error and its errors array
    let errorsArr: unknown[] | null = null
    if ('error' in parsed) {
      const errUnknown = (parsed as { error: unknown }).error
      if (typeof errUnknown === 'object' && errUnknown !== null && 'errors' in errUnknown) {
        const maybeErrors = (errUnknown as Record<string, unknown>)['errors']
        if (Array.isArray(maybeErrors)) errorsArr = maybeErrors
      }
    }

    // If sort exists and validation flagged it, raise specific message
    if (sortValue !== undefined) {
      const hasSortIssue = Array.isArray(errorsArr)
        ? errorsArr.some((e) => {
            const issueObj = (typeof e === 'object' && e !== null)
              ? (e as Record<string, unknown>)
              : undefined
            const path = issueObj && Array.isArray(issueObj['path'])
              ? (issueObj['path'] as unknown[]).map(String).join('.')
              : ''
            return path === 'sort'
          })
        : true
      if (hasSortIssue) {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid sort field '${sortValue}'. Allowed: created_at, code, status`,
        })
      }
    }

    // Fallback aggregated validation error message
    let details = 'Invalid input'
    if (Array.isArray(errorsArr)) {
      details = errorsArr
        .map((e) => {
          const issueObj = (typeof e === 'object' && e !== null)
            ? (e as Record<string, unknown>)
            : {}
          const pathArr = Array.isArray(issueObj['path']) ? (issueObj['path'] as unknown[]) : []
          const path = pathArr.length ? pathArr.map(String).join('.') : 'root'
          const messageVal = issueObj['message']
          const message = typeof messageVal === 'string' ? messageVal : 'Invalid'
          return `${path}: ${message}`
        })
        .join('; ')
    } else if ('error' in parsed) {
      const errUnknown = (parsed as { error: unknown }).error
      if (typeof errUnknown === 'object' && errUnknown !== null && 'message' in errUnknown) {
        const msg = (errUnknown as Record<string, unknown>)['message']
        if (typeof msg === 'string') details = msg
      }
    }
    throw createError({ statusCode: 400, statusMessage: `Validation error: ${details}` })
  }
  return parsed.data
}
