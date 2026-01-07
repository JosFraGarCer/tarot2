// server/utils/rateLimit.ts
import { createError, type H3Event } from 'h3'

interface RateLimitOptions {
  /** scope used for logs */
  scope: string
  /** unique identifier per bucket (route, method, etc.) */
  identifier: string
  /** max requests allowed within the window */
  max: number
  /** window size in milliseconds */
  windowMs: number
}

interface Bucket {
  count: number
  expiresAt: number
}

const buckets = new Map<string, Bucket>()

export function getClientIp(event: H3Event): string | null {
  // En producción, confía solo si sabes que estás detrás de un proxy configurado
  // Para ser seguros, preferimos el remoteAddress real a menos que se configure confianza explícita
  const xForwardedFor = event.node.req.headers['x-forwarded-for']
  if (xForwardedFor) {
    const ips = (Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor).split(',')
    return ips[0].trim()
  }
  return event.node.req.socket?.remoteAddress ?? null
}

export function enforceRateLimit(event: H3Event, options: RateLimitOptions): void {
  const logger = event.context.logger ?? (globalThis as Record<string, unknown>).logger as { warn?: (obj: unknown, msg?: string) => void } | undefined
  const ip = getClientIp(event) ?? 'unknown'
  const contextUser = event.context.user as { id?: string | number } | undefined
  const userKey = contextUser?.id ?? 'anon'
  const baseKey = `${options.identifier}:${userKey}:${ip}`
  const now = Date.now()

  let bucket = buckets.get(baseKey)
  if (!bucket || bucket.expiresAt <= now) {
    bucket = { count: 0, expiresAt: now + options.windowMs }
    buckets.set(baseKey, bucket)
  }

  if (bucket.count >= options.max) {
    const retryIn = Math.max(0, Math.ceil((bucket.expiresAt - now) / 1000))
    event.node.res.setHeader('Retry-After', retryIn)
    logger?.warn?.(
      {
        scope: options.scope,
        ip,
        identifier: options.identifier,
        max: options.max,
        windowMs: options.windowMs,
        requestId: event.context.requestId ?? null,
      },
      'Rate limit exceeded',
    )
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      data: {
        success: false,
        error: {
          message: 'Too Many Requests',
          scope: options.scope,
        },
      },
    })
  }

  bucket.count += 1
}
