// shared/editorial/transitions.ts
import type { CardStatus } from './card-status'

export const cardStatusTransitions: Record<CardStatus, CardStatus[]> = {
  draft: ['pending_review', 'archived'],
  pending_review: ['review', 'changes_requested'],
  review: ['approved', 'changes_requested'],
  changes_requested: ['draft'],
  translation_review: ['approved', 'changes_requested'],
  approved: ['published', 'rejected'],
  rejected: ['draft'],
  published: ['archived'],
  archived: [],
}

export interface TransitionRequirement {
  permissions?: string[]
  roles?: string[]
}

export const transitionRequirements: Partial<Record<CardStatus, Partial<Record<CardStatus, TransitionRequirement>>>> = {
  draft: {
    pending_review: { permissions: ['canEditContent'] },
    archived: { permissions: ['canEditContent'] },
  },
  pending_review: {
    review: { permissions: ['canReview'] },
    changes_requested: { permissions: ['canReview'] },
  },
  review: {
    approved: { permissions: ['canReview'] },
    changes_requested: { permissions: ['canReview'] },
  },
  changes_requested: {
    draft: { permissions: ['canEditContent'] },
  },
  translation_review: {
    approved: { permissions: ['canTranslate'] },
    changes_requested: { permissions: ['canTranslate'] },
  },
  approved: {
    published: { permissions: ['canPublish'] },
    rejected: { permissions: ['canPublish'] },
  },
  rejected: {
    draft: { permissions: ['canEditContent'] },
  },
  published: {
    archived: { permissions: ['canPublish'] },
  },
}
