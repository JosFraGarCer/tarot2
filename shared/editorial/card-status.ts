// shared/editorial/card-status.ts
import { z } from 'zod'

export const CardStatus = z.enum([
  'draft',
  'pending_review',
  'review',
  'changes_requested',
  'translation_review',
  'approved',
  'rejected',
  'published',
  'archived',
])

export type CardStatus = z.infer<typeof CardStatus>
