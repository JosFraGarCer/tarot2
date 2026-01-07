// app/utils/badges.ts

type SupportedColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral'

type BadgeVariant = 'soft' | 'subtle'

type BadgeMap = Record<string, BadgeDescriptor>

type BadgeDescriptor = {
  color: SupportedColor
  icon?: string | null
  labelKey?: string
  fallbackLabel?: string
  variant?: BadgeVariant
}

type BadgeResult = BadgeDescriptor & { value: string; variant: BadgeVariant }

const STATUS_MAP: BadgeMap = {
  draft: {
    color: 'neutral',
    icon: 'i-heroicons-pencil-square',
    labelKey: 'ui.status.draft',
  },
  review: {
    color: 'warning',
    icon: 'i-heroicons-eye',
    labelKey: 'ui.status.review',
  },
  pending_review: {
    color: 'warning',
    icon: 'i-heroicons-clock',
    labelKey: 'ui.status.pendingReview',
  },
  translation_review: {
    color: 'warning',
    icon: 'i-heroicons-language',
    labelKey: 'ui.status.translationReview',
  },
  approved: {
    color: 'primary',
    icon: 'i-heroicons-check-circle',
    labelKey: 'ui.status.approved',
  },
  published: {
    color: 'success',
    icon: 'i-heroicons-megaphone',
    labelKey: 'ui.status.published',
  },
  rejected: {
    color: 'error',
    icon: 'i-heroicons-x-circle',
    labelKey: 'ui.status.rejected',
  },
  archived: {
    color: 'neutral',
    icon: 'i-heroicons-archive-box',
    labelKey: 'ui.status.archived',
  },
}

const RELEASE_MAP: BadgeMap = {
  dev: {
    color: 'neutral',
    icon: 'i-heroicons-wrench-screwdriver',
    labelKey: 'ui.release.dev',
  },
  alpha: {
    color: 'warning',
    icon: 'i-heroicons-sparkles',
    labelKey: 'ui.release.alpha',
  },
  beta: {
    color: 'primary',
    icon: 'i-heroicons-beaker',
    labelKey: 'ui.release.beta',
  },
  candidate: {
    color: 'primary',
    icon: 'i-heroicons-rocket-launch',
    labelKey: 'ui.release.candidate',
  },
  release: {
    color: 'success',
    icon: 'i-heroicons-trophy',
    labelKey: 'ui.release.release',
  },
  revision: {
    color: 'error',
    icon: 'i-heroicons-arrow-path-rounded-square',
    labelKey: 'ui.release.revision',
  },
}

const TRANSLATION_MAP: BadgeMap = {
  complete: {
    color: 'success',
    icon: 'i-heroicons-language',
    labelKey: 'ui.translation.complete',
  },
  partial: {
    color: 'warning',
    icon: 'i-heroicons-language',
    labelKey: 'ui.translation.partialFallback',
  },
  missing: {
    color: 'error',
    icon: 'i-heroicons-x-mark',
    labelKey: 'ui.translation.missing',
  },
}

const USER_STATUS_MAP: BadgeMap = {
  active: {
    color: 'success',
    icon: 'i-heroicons-user-circle',
    labelKey: 'domains.user.statusActive',
  },
  inactive: {
    color: 'neutral',
    icon: 'i-heroicons-user',
    labelKey: 'domains.user.statusInactive',
  },
  banned: {
    color: 'error',
    icon: 'i-heroicons-no-symbol',
    labelKey: 'domains.user.statusBanned',
  },
  suspended: {
    color: 'warning',
    icon: 'i-heroicons-pause-circle',
    labelKey: 'domains.user.statusSuspended',
  },
  pending: {
    color: 'warning',
    icon: 'i-heroicons-clock',
    labelKey: 'domains.user.statusPending',
  },
  invited: {
    color: 'primary',
    icon: 'i-heroicons-envelope-open',
    labelKey: 'domains.user.statusInvited',
  },
}

function resolveMeta(value: string | null | undefined, map: BadgeMap, fallback: BadgeDescriptor): BadgeResult {
  const normalized = (value ?? '').toString().toLowerCase()
  const entry = map[normalized]
  const descriptor = entry ?? fallback
  return {
    value: normalized || fallback.fallbackLabel || 'unknown',
    color: descriptor.color,
    icon: descriptor.icon,
    labelKey: descriptor.labelKey,
    fallbackLabel: descriptor.fallbackLabel ?? (normalized || 'Unknown'),
    variant: descriptor.variant ?? (descriptor.color === 'neutral' ? 'subtle' : 'soft'),
  }
}

const STATUS_FALLBACK: BadgeDescriptor = {
  color: 'neutral',
  icon: 'i-heroicons-question-mark-circle',
  labelKey: 'ui.status.unknown',
  fallbackLabel: 'Unknown status',
}

const RELEASE_FALLBACK: BadgeDescriptor = {
  color: 'neutral',
  icon: 'i-heroicons-ellipsis-horizontal-circle',
  labelKey: 'ui.release.unknown',
  fallbackLabel: 'Unknown release stage',
}

const TRANSLATION_FALLBACK: BadgeDescriptor = {
  color: 'neutral',
  icon: 'i-heroicons-language',
  labelKey: 'ui.translation.unknown',
  fallbackLabel: 'Unknown translation status',
}

const USER_FALLBACK: BadgeDescriptor = {
  color: 'neutral',
  icon: 'i-heroicons-user',
  labelKey: 'domains.user.status',
  fallbackLabel: 'Unknown status',
}

export function statusColor(value?: string | null): BadgeResult {
  return resolveMeta(value, STATUS_MAP, STATUS_FALLBACK)
}

export function releaseColor(stage?: string | null): BadgeResult {
  return resolveMeta(stage, RELEASE_MAP, RELEASE_FALLBACK)
}

export function translationStatusColor(status?: string | null): BadgeResult {
  return resolveMeta(status, TRANSLATION_MAP, TRANSLATION_FALLBACK)
}

export function resolveUserStatusBadge(status?: string | null): BadgeResult {
  return resolveMeta(status, USER_STATUS_MAP, USER_FALLBACK)
}

export type { BadgeVariant, BadgeResult }
