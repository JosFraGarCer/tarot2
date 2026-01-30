// app/composables/common/useAuthorization.ts
// Centralized ACL and authorization composable

import { computed, type ComputedRef, type Ref } from 'vue'

interface UserPermissions {
  canReview?: boolean
  canPublish?: boolean
  canTranslate?: boolean
  canAssignTags?: boolean
  canEditContent?: boolean
  canManageUsers?: boolean
  canResolveFeedback?: boolean
  canSeeAllStatuses?: boolean
  canRevert?: boolean
}

interface UserRole {
  id: number
  name: string
}

interface AuthUser {
  id: number
  email: string
  username: string
  status: 'active' | 'suspended' | 'inactive'
  permissions: UserPermissions
  roles: UserRole[]
}

export type AuthorizationCheck = ComputedRef<boolean>

export interface AuthorizationContext {
  user: ComputedRef<AuthUser | null | undefined>
  isAuthenticated: ComputedRef<boolean>
  isAdmin: ComputedRef<boolean>
  can: (permission: keyof UserPermissions) => AuthorizationCheck
  canAny: (...permissions: (keyof UserPermissions)[]) => AuthorizationCheck
  canAll: (...permissions: (keyof UserPermissions)[]) => AuthorizationCheck
  hasRole: (roleName: string) => AuthorizationCheck
  checkAccess: (resource: string, action: string) => AuthorizationCheck
}

export function useAuthorization(userRef: Ref<AuthUser | null | undefined>): AuthorizationContext {
  const user = computed(() => userRef.value)

  const isAuthenticated = computed(() => {
    const u = user.value
    return !!(u && u.status === 'active')
  })

  const isAdmin = computed(() => {
    const u = user.value
    if (!u) return false
    const roleName = u.roles?.[0]?.name?.toLowerCase()
    return roleName === 'admin' || u.permissions?.canManageUsers === true
  })

  function can(permission: keyof UserPermissions): AuthorizationCheck {
    return computed(() => {
      const u = user.value
      if (!u) return false
      const roleName = u.roles?.[0]?.name?.toLowerCase()
      if (roleName === 'admin') return true
      return u.permissions?.[permission] === true
    })
  }

  function canAny(...permissions: (keyof UserPermissions)[]): AuthorizationCheck {
    return computed(() => {
      const u = user.value
      if (!u) return false
      const roleName = u.roles?.[0]?.name?.toLowerCase()
      if (roleName === 'admin') return true
      return permissions.some(p => u.permissions?.[p] === true)
    })
  }

  function canAll(...permissions: (keyof UserPermissions)[]): AuthorizationCheck {
    return computed(() => {
      const u = user.value
      if (!u) return false
      const roleName = u.roles?.[0]?.name?.toLowerCase()
      if (roleName === 'admin') return true
      return permissions.every(p => u.permissions?.[p] === true)
    })
  }

  function hasRole(roleName: string): AuthorizationCheck {
    return computed(() => {
      const u = user.value
      if (!u) return false
      const userRole = u.roles?.[0]?.name?.toLowerCase()
      return userRole === roleName.toLowerCase()
    })
  }

  function checkAccess(resource: string, action: string): AuthorizationCheck {
    return computed(() => {
      const u = user.value
      if (!u) return false

      const roleName = u.roles?.[0]?.name?.toLowerCase()
      if (roleName === 'admin') return true

      const perms = u.permissions || {}

      const resourceActionMap: Record<string, Partial<Record<string, keyof UserPermissions>>> = {
        content: {
          create: 'canEditContent',
          edit: 'canEditContent',
          delete: 'canEditContent',
        },
        users: {
          create: 'canManageUsers',
          edit: 'canManageUsers',
          delete: 'canManageUsers',
        },
        feedback: {
          resolve: 'canResolveFeedback',
        },
        publish: {
          publish: 'canPublish',
        },
        review: {
          review: 'canReview',
        },
        translate: {
          translate: 'canTranslate',
        },
        tags: {
          assign: 'canAssignTags',
        },
        revert: {
          revert: 'canRevert',
        },
      }

      const actionPerm = resourceActionMap[resource]?.[action]
      if (!actionPerm) return true

      return perms[actionPerm] === true
    })
  }

  return {
    user,
    isAuthenticated,
    isAdmin,
    can,
    canAny,
    canAll,
    hasRole,
    checkAccess,
  }
}

// Singleton for global access (uses Nuxt composable auto-import)
let globalContext: AuthorizationContext | null = null

export function provideAuthorization(userRef: Ref<AuthUser | null | undefined>) {
  globalContext = useAuthorization(userRef)
  return globalContext
}

export function useAuthContext(): AuthorizationContext {
  if (!globalContext) {
    throw new Error('Authorization context not provided. Call provideAuthorization first.')
  }
  return globalContext
}
