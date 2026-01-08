// server/utils/users.ts
interface RoleLike {
  permissions?: Record<string, boolean | number | null | undefined>
}

export function mergePermissions(roles: RoleLike[] = []): Record<string, boolean> {
  const merged: Record<string, boolean> = {}

  // Sort roles to ensure consistent priority (e.g., specific roles might override generic ones)
  // For now, we simple iterate. If we had "Deny" permissions, we'd handle them here.
  for (const role of roles) {
    const perms = role.permissions || {}
    for (const key of Object.keys(perms)) {
      const val = perms[key]
      
      // Conflict resolution: Explicit 'false' (Deny) overrides 'true' (Allow)
      // This is a safer default for security.
      if (val === false) {
        merged[key] = false
      } else if (merged[key] !== false) {
        merged[key] = merged[key] || !!val
      }
    }
  }

  return merged
}
