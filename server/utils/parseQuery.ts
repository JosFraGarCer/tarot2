// server/utils/parseQuery.ts
import { getValidatedQuery, type H3Event } from 'h3'
import type { ZodSchema } from 'zod'

interface ParseQueryOptions {
  logLevel?: 'debug' | 'info'
  scope?: string
}

/**
 * Valida y parsea la query de la request usando getValidatedQuery de h3 (Nuxt 5 native).
 * Nota: Esta función es asíncrona ahora para cumplir con el estándar.
 */
export async function parseQuery<TSchema extends ZodSchema<unknown>>(
  event: H3Event,
  schema: TSchema,
  options: ParseQueryOptions = {},
): Promise<ReturnType<TSchema['parse']>> {
  const parsed = await getValidatedQuery(event, schema.parse)
  const logger = event.context.logger
  const level = options.logLevel ?? 'debug'
  const scope = options.scope ?? 'query.parse'

  if (logger && typeof (logger as any)[level] === 'function') {
    (logger as any)[level]({ scope, params: parsed }, 'Parsed query parameters')
  }

  return parsed
}
