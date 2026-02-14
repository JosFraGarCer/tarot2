// server/middleware/02.rate-limit.ts
import { defineEventHandler } from 'h3'
import { enforceRateLimit, getClientIp } from '../utils/rateLimit'

const GLOBAL_LIMIT = {
  max: 240,
  windowMs: 5 * 60 * 1000,
}

const ROUTE_BUCKETS: Array<{ regex: RegExp; identifier: string; max: number; windowMs: number }> = [
  { regex: /^\/?api\/auth\/login(?:\/?|$)/i, identifier: 'auth.login', max: 10, windowMs: 60_000 },
  { regex: /^\/?api\/auth\/logout(?:\/?|$)/i, identifier: 'auth.logout', max: 30, windowMs: 60_000 },
  { regex: /^\/?api\/content_versions\/publish(?:\/?|$)/i, identifier: 'content_versions.publish', max: 8, windowMs: 60_000 },
  { regex: /^\/?api\/content_revisions\/(?:[^/]+)\/revert(?:\/?|$)/i, identifier: 'content_revisions.revert', max: 8, windowMs: 60_000 },
  { regex: /^\/?api\/content_feedback(?:\/?|$)/i, identifier: 'content_feedback', max: 45, windowMs: 60_000 },
  { regex: /^\/?api\/(?:database\/import\.json|database\/import\.sql)(?:\/?|$)/i, identifier: 'database.import', max: 4, windowMs: 60_000 },
  { regex: /^\/?api\/uploads(?:\/?|$)/i, identifier: 'uploads', max: 20, windowMs: 60_000 },
]

export default defineEventHandler((event) => {
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.VITEST
  if (isTestEnv) {
    return
  }

  const path = event.path ?? event.node.req.url?.split('?')[0] ?? ''

  if (!path.startsWith('/api') && !path.startsWith('api/')) {
    return
  }

  const logger = event.context.logger ?? globalThis.logger
  const requestId = event.context.requestId ?? null
  const ip = getClientIp(event) ?? 'unknown'
  const method = event.node.req.method ?? 'GET'

  const checks = [
    {
      scope: 'middleware.rateLimit.global',
      identifier: `middleware.global.api:${method}`,
      max: GLOBAL_LIMIT.max,
      windowMs: GLOBAL_LIMIT.windowMs,
    },
  ]

  for (const bucket of ROUTE_BUCKETS) {
    if (!bucket.regex.test(path)) continue
    checks.push({
      scope: 'middleware.rateLimit.route',
      identifier: `middleware.route:${bucket.identifier}:${method}`,
      max: bucket.max,
      windowMs: bucket.windowMs,
    })
  }

  for (const check of checks) {
    const key = check.identifier

    try {
      enforceRateLimit(event, check)
      logger?.debug?.(
        {
          scope: 'middleware.rateLimit',
          path,
          ip,
          key,
          wasLimited: false,
          requestId,
        },
        'Rate limit check passed',
      )
    } catch (error) {
      logger?.warn?.(
        {
          scope: 'middleware.rateLimit',
          path,
          ip,
          key,
          wasLimited: true,
          requestId,
        },
        'Rate limit triggered',
      )
      throw error
    }
  }
})
