// server/schemas/content-feedback.ts
import { z } from 'zod'
import { queryBoolean } from '../utils/zod'

const entityTypeEnum = z.enum([
  'arcana',
  'facet',
  'base_card',
  'base_card_type',
  'world_card',
  'world',
  'base_skills',
])

const feedbackStatusEnum = z.enum(['open', 'resolved', 'dismissed'])

export const contentFeedbackQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  entity_type: entityTypeEnum.optional(),
  entity_id: z.coerce.number().int().optional(),
  version_number: z.coerce.number().int().optional(),
  language_code: z.string().max(5).optional(),
  status: feedbackStatusEnum.optional(),
  category: z.string().optional(),
  created_by: z.coerce.number().int().optional(),
  resolved_by: z.coerce.number().int().optional(),
  has_resolution: queryBoolean.optional(),
  sort: z
    .enum(['created_at', 'resolved_at', 'status', 'entity', 'version_number'])
    .optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})

export const contentFeedbackCreateSchema = z.object({
  entity_type: entityTypeEnum,
  entity_id: z.number().int(),
  comment: z.string().min(1),
  category: z.string().optional(),
  language_code: z.string().max(5).optional(),
  version_number: z.number().int().optional(),
  status: feedbackStatusEnum.optional(),
})

export const contentFeedbackUpdateSchema = z.object({
  comment: z.string().min(1).optional(),
  category: z.string().optional(),
  language_code: z.string().max(5).nullable().optional(),
  status: feedbackStatusEnum.optional(),
  version_number: z.number().int().nullable().optional(),
  resolved_by: z.number().int().nullable().optional(),
  resolved_at: z.union([z.coerce.date(), z.null()]).optional(),
})

export type ContentFeedbackQuery = z.infer<typeof contentFeedbackQuerySchema>
export type ContentFeedbackCreate = z.infer<typeof contentFeedbackCreateSchema>
export type ContentFeedbackUpdate = z.infer<typeof contentFeedbackUpdateSchema>
