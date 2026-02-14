// server/middleware/01.auth.guard.ts
// /server/middleware/01.auth.guard.ts
import { defineEventHandler, createError } from 'h3'

const PUBLIC_API_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/logout',
])

type PermissionRule = {
  regex: RegExp
  methods?: string[]
  anyOf: string[]
}

type GuardUser = {
  status?: string
  permissions?: Record<string, boolean>
}

const SENSITIVE_RULES: PermissionRule[] = [
  // User & Role management
  { regex: /^\/api\/user(?:\/|$)/i, anyOf: ['canManageUsers'] },
  { regex: /^\/api\/role(?:\/|$)/i, anyOf: ['canManageUsers'] },

  // Content Versions
  {
    regex: /^\/api\/content_versions\/[^/]+(?:\/|$)/i,
    methods: ['DELETE'],
    anyOf: ['canPublish'],
  },
  {
    regex: /^\/api\/content_versions\/[^/]+(?:\/|$)/i,
    methods: ['PATCH'],
    anyOf: ['canPublish'],
  },
  {
    regex: /^\/api\/content_versions(?:\/|$)/i,
    methods: ['POST'],
    anyOf: ['canPublish'],
  },
  {
    regex: /^\/api\/content_versions\/publish(?:\/|$)/i,
    methods: ['POST'],
    anyOf: ['canPublish'],
  },

  // Content Revisions
  {
    regex: /^\/api\/content_revisions\/[^/]+\/revert(?:\/|$)/i,
    methods: ['POST'],
    anyOf: ['canPublish'],
  },
  {
    regex: /^\/api\/content_revisions(?:\/|$)/i,
    methods: ['POST', 'PATCH', 'DELETE'],
    anyOf: ['canReview'],
  },

  // Feedback
  {
    regex: /^\/api\/content_feedback(?:\/|$)/i,
    methods: ['POST', 'PATCH', 'DELETE'],
    anyOf: ['canReview', 'canPublish'],
  },
]

function hasAnyPermission(perms: Record<string, boolean>, required: string[]): boolean {
  return required.some((key) => perms[key] === true)
}

export default defineEventHandler((event) => {
  const path = event.path || ''
  const method = (event.node.req.method || 'GET').toUpperCase()

  if (!path.startsWith('/api')) return
  if (method === 'OPTIONS') return

  // Public endpoints
  if (PUBLIC_API_PATHS.has(path)) return

  const user = (event.context as Record<string, unknown>).user as GuardUser | undefined

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated',
    })
  }

  if (user.status === 'suspended') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Account suspended',
    })
  }

  const perms: Record<string, boolean> = user.permissions || {}

  let matchedRule = false

  for (const rule of SENSITIVE_RULES) {
    if (!rule.regex.test(path)) continue
    if (rule.methods && !rule.methods.includes(method)) continue

    matchedRule = true

    if (hasAnyPermission(perms, rule.anyOf)) {
      return
    }

    throw createError({
      statusCode: 403,
      statusMessage: `Permission required (${rule.anyOf.join(' OR ')})`,
    })
  }

  /**
   * 🔐 Deny-by-default for mutations not explicitly declared
   * Prevents silent exposure of new write endpoints.
   */
  if (!matchedRule && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Mutation requires explicit permission rule',
    })
  }
})