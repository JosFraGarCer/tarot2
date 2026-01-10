// shared/schemas/content-feedback.ts
import { z } from 'zod'

// Enums for content feedback
export const entityTypeEnum = z.enum([
  'arcana',
  'base_card',
  'base_card_type',
  'facet',
  'world_card',
  'world',
  'base_skills'
])

export const feedbackStatusEnum = z.enum(['open', 'resolved', 'dismissed'])

export const feedbackCategoryEnum = z.enum([
  'translation',
  'content',
  'technical',
  'design',
  'other',
  'bug',      // Legacy values
  'suggestion', // Legacy values
  'balance',   // Legacy values
])

// Schema for content feedback queries
export const contentFeedbackQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  entity_type: entityTypeEnum.optional(),
  entity_id: z.coerce.number().int().optional(),
  version_number: z.coerce.number().int().optional(),
  language_code: z.string().max(5).optional(),
  status: feedbackStatusEnum.optional(),
  category: feedbackCategoryEnum.optional(),
  created_by: z.coerce.number().int().optional(),
  resolved_by: z.coerce.number().int().optional(),
  created_from: z.coerce.date().optional(),
  created_to: z.coerce.date().optional(),
  sort: z.enum([
    'created_at',
    'entity_type',
    'entity_id',
    'status',
    'category',
    'created_by'
  ]).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})

// Schema for creating content feedback
export const contentFeedbackCreateSchema = z.object({
  entity_type: entityTypeEnum,
  entity_id: z.coerce.number().int().positive(),
  version_number: z.coerce.number().int().optional(),
  language_code: z.string().max(5).optional(),
  comment: z.string().min(1, 'Comment is required').max(2000),
  category: feedbackCategoryEnum.optional(),
})

// Schema for updating content feedback
export const contentFeedbackUpdateSchema = z.object({
  status: feedbackStatusEnum.optional(),
  category: feedbackCategoryEnum.optional(),
  resolved_by: z.coerce.number().int().optional(),
})

// Types exportados
export type EntityType = z.infer<typeof entityTypeEnum>
export type FeedbackStatus = z.infer<typeof feedbackStatusEnum>
export type FeedbackCategory = z.infer<typeof feedbackCategoryEnum>
export type ContentFeedbackQuery = z.infer<typeof contentFeedbackQuerySchema>
export type ContentFeedbackCreate = z.infer<typeof contentFeedbackCreateSchema>
export type ContentFeedbackUpdate = z.infer<typeof contentFeedbackUpdateSchema>
