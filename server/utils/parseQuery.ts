// server/utils/parseQuery.ts
import { getQuery, type H3Event } from 'h3'
import type { ZodSchema } from 'zod'
import { safeParseOrThrow } from './validate'

interface ParseQueryOptions {
  logLevel?: 'debug' | 'info'
  scope?: string
}

export function parseQuery<TSchema extends ZodSchema<unknown>>(
  event: H3Event,
  schema: TSchema,
  options: ParseQueryOptions = {},
): ReturnType<TSchema['parse']> {
  const raw = getQuery(event)
  const parsed = safeParseOrThrow(schema, raw)
  const logger = event.context.logger ?? (globalThis as Record<string, unknown>).logger as { [key: string]: (obj: unknown, msg?: string) => void } | undefined
  const level = options.logLevel ?? 'debug'
  const scope = options.scope ?? 'query.parse'

  if (logger && typeof logger[level] === 'function') {
    logger[level]({ scope, params: parsed }, 'Parsed query parameters')
  }

  return parsed
}
