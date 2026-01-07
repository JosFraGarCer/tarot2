// server/plugins/utils.ts
import { readValidatedBody, type H3Event } from 'h3'
import type { ZodType } from 'zod'
import { success as _success, fail as _fail } from '../utils/response'
import { getUserFromEvent } from '../plugins/auth'

/**
 * Valida y parsea el body de la request usando readValidatedBody de h3 (Nuxt 5 native).
 */
export async function parseBody<T>(event: H3Event, schema: ZodType<T>): Promise<T> {
  return await readValidatedBody(event, schema.parse)
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
