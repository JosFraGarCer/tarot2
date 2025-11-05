// server/types/permissions.ts
export interface RolePermissions {
  canReview: boolean
  canPublish: boolean
  canTranslate: boolean
  canAssignTags: boolean
  canEditContent: boolean
  canManageUsers: boolean
  canResolveFeedback: boolean
}
