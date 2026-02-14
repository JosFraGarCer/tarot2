// server/utils/parseQuery.ts
import { getQuery, type H3Event } from 'h3'
import type { ZodType } from 'zod'
import { safeParseOrThrow } from './validate'

interface ParseQueryOptions {
  logLevel?: 'debug' | 'info'
  scope?: string
}

interface QueryLogger {
  debug?: (obj: Record<string, unknown>, msg?: string) => void
  info?: (obj: Record<string, unknown>, msg?: string) => void
}

export function parseQuery<T>(
  event: H3Event,
  schema: ZodType<T>,
  options: ParseQueryOptions = {},
): T {
  const raw = getQuery(event)
  const parsed = safeParseOrThrow(schema, raw)
  const logger =
    (event.context.logger as QueryLogger | undefined) ??
    (globalThis as { logger?: QueryLogger }).logger
  const level = options.logLevel ?? 'debug'
  const scope = options.scope ?? 'query.parse'

  if (logger && typeof logger[level] === 'function') {
    logger[level]({ scope, params: parsed }, 'Parsed query parameters')
  }

  return parsed
}
