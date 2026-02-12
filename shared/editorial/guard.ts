// shared/editorial/guard.ts
import type { CardStatus } from './card-status'
import { cardStatusTransitions, transitionRequirements } from './transitions'
import type { TransitionRequirement } from './transitions'

export interface EditorialContext {
  hasBaseContent: boolean
  hasAtLeastOneTranslation: boolean
  hasEffectsDefined: boolean
}

export interface EditorialUserContext {
  roles: string[]
  permissions: Record<string, boolean>
}

export interface TransitionResult {
  allowed: boolean
  reason?: string
  code?: 'INVALID_TRANSITION' | 'CONTENT_GUARD' | 'PERMISSION_DENIED'
}

export function canTransition(
  from: CardStatus,
  to: CardStatus,
  ctx: EditorialContext,
  user?: EditorialUserContext | null,
): TransitionResult {
  if (!cardStatusTransitions[from].includes(to)) {
    return { allowed: false, reason: 'Invalid status transition', code: 'INVALID_TRANSITION' }
  }

  const requirement: TransitionRequirement | undefined = transitionRequirements[from]?.[to]

  if (requirement && user) {
    const permissionDenied = checkPermissionRequirement(requirement, user)
    if (permissionDenied) {
      return { allowed: false, reason: permissionDenied, code: 'PERMISSION_DENIED' }
    }
  }

  if (to === 'published') {
    if (!ctx.hasBaseContent)
      return { allowed: false, reason: 'Base content incomplete', code: 'CONTENT_GUARD' }

    if (!ctx.hasAtLeastOneTranslation)
      return { allowed: false, reason: 'No valid translation available', code: 'CONTENT_GUARD' }

    if (!ctx.hasEffectsDefined)
      return { allowed: false, reason: 'No effects defined', code: 'CONTENT_GUARD' }
  }

  return { allowed: true }
}

function checkPermissionRequirement(
  requirement: TransitionRequirement,
  user: EditorialUserContext,
): string | null {
  if (requirement.permissions?.length) {
    const missing = requirement.permissions.filter(p => !user.permissions[p])
    if (missing.length) {
      return `Missing required permission${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`
    }
  }

  if (requirement.roles?.length) {
    const hasRole = requirement.roles.some(r => user.roles.includes(r))
    if (!hasRole) {
      return `Requires one of the following roles: ${requirement.roles.join(', ')}`
    }
  }

  return null
}
