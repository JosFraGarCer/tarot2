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

function isProxyTrusted(): boolean {
  const raw = process.env.TRUST_PROXY
  if (!raw) return false
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
}

function firstHeaderValue(value: string | string[] | undefined): string | null {
  if (!value) return null
  const str = Array.isArray(value) ? (value[0] ?? '') : value
  if (!str) return null
  const candidate = str.split(',')[0]?.trim()
  return candidate || null
}

// Clean up expired buckets every hour to prevent memory leaks
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.expiresAt <= now) {
        buckets.delete(key)
      }
    }
  }, 3600000) // 1 hour
}

export function getClientIp(event: H3Event): string | null {
  if (isProxyTrusted()) {
    const forwarded = firstHeaderValue(event.node.req.headers['x-forwarded-for'])
    if (forwarded) return forwarded

    const realIp = firstHeaderValue(event.node.req.headers['x-real-ip'])
    if (realIp) return realIp

    const forwardedHeader = firstHeaderValue(event.node.req.headers.forwarded)
    if (forwardedHeader) {
      const match = forwardedHeader.match(/for=(?:"?)([^;,"]+)(?:"?)/i)
      if (match?.[1]) return match[1]
    }
  }

  return event.node.req.socket?.remoteAddress ?? null
}

export function enforceRateLimit(event: H3Event, options: RateLimitOptions): void {
  const logger = event.context.logger
  const ip = getClientIp(event) ?? 'unknown'
  const context = event.context as Record<string, unknown>
  const user = context.user as { id?: number } | undefined
  const userKey = user?.id ?? 'anon'
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
        requestId: context.requestId ?? null,
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
