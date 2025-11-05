// server/utils/users.ts
export function mergePermissions(roles: any[]): Record<string, boolean> {
  const merged: Record<string, boolean> = {}
  for (const role of roles || []) {
    const perms = role?.permissions || {}
    for (const key of Object.keys(perms)) {
      merged[key] = merged[key] || !!perms[key]
    }
  }
  return merged
}
