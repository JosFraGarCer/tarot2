// server/utils/users.ts
interface RoleLike {
  permissions?: Record<string, boolean | number | null | undefined>
}

export function mergePermissions(roles: RoleLike[] = []): Record<string, boolean> {
  const merged: Record<string, boolean> = {}

  for (const role of roles) {
    const perms = role.permissions || {}
    for (const key of Object.keys(perms)) {
      merged[key] = merged[key] || !!perms[key]
    }
  }

  return merged
}
