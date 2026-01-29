// app/utils/userStatus.ts
// /app/utils/userStatus.ts
// This module provides user status helpers
export type UserStatusColor = 'neutral' | 'primary' | 'warning' | 'success' | 'error'
export type UserStatusVariant = 'subtle' | 'soft' | 'outline'

export interface UserStatusMeta {
  labelKey: string
  color: UserStatusColor
  variant: UserStatusVariant
}

const MAP: Record<string, UserStatusMeta> = {
  active: { labelKey: 'domains.user.statusActive', color: 'success', variant: 'soft' },
  inactive: { labelKey: 'domains.user.statusInactive', color: 'neutral', variant: 'outline' },
  suspended: { labelKey: 'domains.user.statusSuspended', color: 'warning', variant: 'soft' },
  banned: { labelKey: 'domains.user.statusBanned', color: 'error', variant: 'soft' },
  pending: { labelKey: 'domains.user.statusPending', color: 'warning', variant: 'outline' },
}

export function getUserStatusMeta(status?: string | null): (UserStatusMeta & { value: string }) | null {
  if (!status) return null
  const normalized = status.toLowerCase()
  const meta = MAP[normalized]
  return meta ? { value: normalized, ...meta } : null
}

export function userStatusLabelKey(status?: string | null): string {
  return getUserStatusMeta(status)?.labelKey ?? 'domains.user.status'
}

export function userStatusVariant(status?: string | null): UserStatusVariant {
  return getUserStatusMeta(status)?.variant ?? 'subtle'
}
