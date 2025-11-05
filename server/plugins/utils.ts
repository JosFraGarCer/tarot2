// server/plugins/utils.ts
import type { ZodType } from 'zod'
import { readBody, type H3Event } from 'h3'
import { safeParseOrThrow } from '../utils/validate'
import { success as _success, fail as _fail } from '../utils/response'
import { getUserFromEvent } from '../plugins/auth'

/**
 * Valida y parsea el body de la request usando Zod.safeParse.
 */
export async function parseBody<T>(event: H3Event, schema: ZodType<T>): Promise<T> {
  const body = await readBody(event)
  return safeParseOrThrow(schema, body)
}

/**
 * Respuesta de éxito unificada.
 */
export function success<T>(data: T) {
  return _success(data)
}

/**
 * Respuesta de error unificada.
 */
export function fail(message: string, _statusCode?: number) {
  return _fail(message)
}

/**
 * Usuario actual autenticado (JWT).
 */
export async function currentUser(event: H3Event) {
  return getUserFromEvent(event)
}

export default defineNitroPlugin(() => {})
