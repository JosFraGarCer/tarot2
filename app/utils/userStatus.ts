// /app/utils/userStatus.ts
export type UserStatusColor = 'neutral' | 'primary' | 'warning' | 'success' | 'error'
export type UserStatusVariant = 'subtle' | 'soft' | 'outline'

export interface UserStatusMeta {
  labelKey: string
  color: UserStatusColor
  variant: UserStatusVariant
}

const MAP: Record<string, UserStatusMeta> = {
  active: { labelKey: 'users.statusActive', color: 'success', variant: 'soft' },
  inactive: { labelKey: 'users.statusInactive', color: 'neutral', variant: 'outline' },
  suspended: { labelKey: 'users.statusSuspended', color: 'warning', variant: 'soft' },
  banned: { labelKey: 'users.statusBanned', color: 'error', variant: 'soft' },
  pending: { labelKey: 'users.statusPending', color: 'warning', variant: 'outline' },
}

export function getUserStatusMeta(status?: string | null): (UserStatusMeta & { value: string }) | null {
  if (!status) return null
  const normalized = status.toLowerCase()
  const meta = MAP[normalized]
  return meta ? { value: normalized, ...meta } : null
}

export function userStatusLabelKey(status?: string | null): string {
  return getUserStatusMeta(status)?.labelKey ?? 'users.status'
}

export function userStatusColor(status?: string | null): UserStatusColor {
  return getUserStatusMeta(status)?.color ?? 'neutral'
}

export function userStatusVariant(status?: string | null): UserStatusVariant {
  return getUserStatusMeta(status)?.variant ?? 'subtle'
}
