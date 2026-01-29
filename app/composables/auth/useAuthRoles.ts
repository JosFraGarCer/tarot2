// app/composables/auth/useAuthRoles.ts
// Logic for determining user roles and permissions
// Extracted from auth.global.ts for reusability

import { computed } from 'vue'
import { useUserStore } from '~/stores/user'

export interface AuthRoleInfo {
  isAdmin: boolean
  isStaff: boolean
  isUser: boolean
  role: string
}

export function useAuthRoles() {
  const store = useUserStore()

  const roleInfo = computed<AuthRoleInfo>(() => {
    const user = store.user
    const perms = user?.permissions || {}

    const role = user?.roles?.[0]?.name?.toLowerCase?.() || ''

    const isAdmin =
      role === 'admin' ||
      perms.canManageUsers === true ||
      perms.canAccessAdmin === true

    const isStaff =
      role === 'staff' ||
      perms.canEditContent === true ||
      perms.canReview === true ||
      perms.canTranslate === true

    const isUser = !isAdmin && !isStaff && !!user

    return {
      isAdmin,
      isStaff,
      isUser,
      role,
    }
  })

  const isAdmin = computed(() => roleInfo.value.isAdmin)
  const isStaff = computed(() => roleInfo.value.isStaff)
  const isUser = computed(() => roleInfo.value.isUser)
  const role = computed(() => roleInfo.value.role)

  return {
    roleInfo,
    isAdmin,
    isStaff,
    isUser,
    role,
  }
}

export function canAccessAdmin(user: { permissions?: Record<string, boolean> } | null): boolean {
  if (!user) return false
  const perms = user.permissions || {}
  return perms.canManageUsers === true || perms.canAccessAdmin === true
}

export function canEditContent(user: { permissions?: Record<string, boolean> } | null): boolean {
  if (!user) return false
  const perms = user.permissions || {}
  return perms.canEditContent === true || perms.canReview === true || perms.canTranslate === true
}
