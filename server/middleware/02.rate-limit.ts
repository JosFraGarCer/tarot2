// server/middleware/02.rate-limit.ts
import { defineEventHandler } from 'h3'
import { enforceRateLimit, getClientIp } from '../utils/rateLimit'

const GLOBAL_LIMIT = {
  max: 3000,
  windowMs: 5 * 60 * 1000,
}

const SENSITIVE_LIMIT = {
  max: 10,
  windowMs: 60 * 1000,
}

const SENSITIVE_PATTERNS: Array<{ regex: RegExp; identifier: string }> = [
  { regex: /^\/?api\/auth\/login(?:\/?|$)/i, identifier: 'auth.login' },
  { regex: /^\/?api\/auth\/logout(?:\/?|$)/i, identifier: 'auth.logout' },
  { regex: /^\/??api\/content_versions\/publish(?:\/??|$)/i, identifier: 'content_versions.publish' },
  { regex: /^\/??api\/content_revisions\/(?:[^/]+)\/revert(?:\/??|$)/i, identifier: 'content_revisions.revert' },
]

export default defineEventHandler((event) => {
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
      identifier: `middleware.global:${method}`,
      max: GLOBAL_LIMIT.max,
      windowMs: GLOBAL_LIMIT.windowMs,
    },
  ]

  const sensitiveMatch = SENSITIVE_PATTERNS.find(pattern => pattern.regex.test(path))

  if (sensitiveMatch) {
    checks.push({
      scope: 'middleware.rateLimit.sensitive',
      identifier: `middleware.sensitive:${sensitiveMatch.identifier}:${method}`,
      max: SENSITIVE_LIMIT.max,
      windowMs: SENSITIVE_LIMIT.windowMs,
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
