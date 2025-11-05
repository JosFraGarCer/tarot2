// app/types/permissions.ts
export type CardStatus =
  | 'draft'
  | 'review'
  | 'pending_review'
  | 'changes_requested'
  | 'translation_review'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'archived'

export interface Permissions {
  canManageUsers?: boolean
  canEditContent?: boolean
  canReview?: boolean
  canTranslate?: boolean
  canPublish?: boolean
  canAssignTags?: boolean
  canResolveFeedback?: boolean
  canSeeAllStatuses?: boolean
  // optional navigation flags
  canAccessManage?: boolean
  canAccessAdmin?: boolean
  // domain extensions
  content?: Record<string, boolean>
  admin?: Record<string, boolean>
}
