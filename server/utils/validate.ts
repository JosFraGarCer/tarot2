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

    // Access Zod error issues using public API
    const issues = parsed.error.issues

    // If sort exists and validation flagged it, raise specific message
    if (sortValue !== undefined) {
      const hasSortIssue = issues.some((e) => {
        const path = Array.isArray(e.path) ? e.path.map(String).join('.') : ''
        return path === 'sort'
      })
      if (hasSortIssue) {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid sort field '${sortValue}'.`,
        })
      }
    }

    // Fallback aggregated validation error message
    let details = 'Invalid input'
    if (issues.length > 0) {
      details = issues
        .map((e) => {
          const pathArr = Array.isArray(e.path) ? e.path : []
          const path = pathArr.length ? pathArr.map(String).join('.') : 'root'
          const message = typeof e.message === 'string' ? e.message : 'Invalid'
          return `${path}: ${message}`
        })
        .join('; ')
    } else if (parsed.error.message) {
      details = parsed.error.message
    }
    throw createError({ statusCode: 400, statusMessage: `Validation error: ${details}` })
  }
  return parsed.data
}
