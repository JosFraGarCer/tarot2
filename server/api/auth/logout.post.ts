// server/api/auth/logout.post.ts
import { defineEventHandler, setCookie } from 'h3'
import { createResponse } from '../../utils/response'
import { enforceRateLimit } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  const logger = event.context.logger ?? globalThis.logger
  const requestId = event.context.requestId ?? null
  const userId = (event.context.user as { id?: number } | undefined)?.id ?? null

  // Fallback limiter if middleware layer is bypassed
  enforceRateLimit(event, {
    scope: 'auth.logout.rate_limit',
    identifier: `${event.node.req.method}:auth.logout`,
    max: 10,
    windowMs: 60_000,
  })

  logger?.info?.({ scope: 'auth.logout.start', requestId, user_id: userId }, 'Logout started')

  // 🔹 Limpia cookie de sesión
  setCookie(event, 'auth_token', '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  })

  logger?.info?.(
    { scope: 'auth.logout.end', requestId, user_id: userId, timeMs: Date.now() - startedAt },
    'Logout completed',
  )

  // 🔹 Respuesta estándar
  return createResponse(null)
})
