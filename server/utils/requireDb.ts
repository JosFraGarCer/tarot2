import { createError, type H3Event } from 'h3'
import type { Kysely } from 'kysely'
import type { DB } from '../database/types'

export function requireDb(event: H3Event): Kysely<DB> {
  const db = (event.context as Record<string, unknown>).db as Kysely<DB> | undefined

  if (!db) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database not available in request context',
    })
  }

  return db
}
