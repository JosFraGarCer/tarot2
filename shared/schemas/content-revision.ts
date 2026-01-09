// shared/schemas/content-revision.ts
import { z } from 'zod'

// Entity types that can have revisions
export const revisionEntityTypeEnum = z.enum([
  'arcana',
  'facet',
  'base_card',
  'base_card_type',
  'world_card',
  'world',
  'base_skills',
])

// Revision status enum
export const revisionStatusEnum = z.enum([
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'published'
])

// Schema for content revision queries
export const contentRevisionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  entity_type: revisionEntityTypeEnum.optional(),
  entity_id: z.coerce.number().int().optional(),
  version_number: z.coerce.number().int().optional(),
  language_code: z.string().max(5).optional(),
  status: z.string().optional(),
  created_by: z.coerce.number().int().optional(),
  created_from: z.coerce.date().optional(),
  created_to: z.coerce.date().optional(),
  notes: z.string().optional(),
  sort: z.enum([
    'created_at',
    'entity_type',
    'entity_id',
    'version_number',
    'language_code',
    'status'
  ]).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})

// Schema for creating content revisions
export const contentRevisionCreateSchema = z.object({
  entity_type: revisionEntityTypeEnum,
  entity_id: z.coerce.number().int().positive(),
  version_number: z.coerce.number().int().positive(),
  diff: z.record(z.string(), z.any()).default({}),
  notes: z.string().optional(),
  language_code: z.string().max(5).optional(),
  status: z.string().optional(),
  prev_snapshot: z.record(z.string(), z.any()).optional(),
  next_snapshot: z.record(z.string(), z.any()).optional(),
  content_version_id: z.coerce.number().int().optional(),
})

// Schema for updating content revisions
export const contentRevisionUpdateSchema = z.object({
  status: z.string().optional(),
  notes: z.string().optional(),
})

// Utility function for parsing JSON values
export function parseJsonValue(
  value: unknown,
  field: string,
  defaultValue?: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (value === undefined) return defaultValue ?? null
  if (value === null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return defaultValue ?? {}
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
      throw new Error('Not an object')
    } catch (_err) {
      throw new z.ZodError([
        {
          path: [field],
          message: 'Must be valid JSON object',
          code: 'custom',
          params: { field }
        }
      ])
    }
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  throw new z.ZodError([
    {
      path: [field],
      message: 'Must be a valid object or JSON string',
      code: 'custom',
      params: { field }
    }
  ])
}

// Schema for route parameters (e.g., { id })
export const paramsSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
})

// Schema for content revision revert operations
export const contentRevisionRevertSchema = z.object({
  notes: z.string().optional(),
})

// Types exportados
export type RevisionEntityType = z.infer<typeof revisionEntityTypeEnum>
export type RevisionStatus = z.infer<typeof revisionStatusEnum>
export type ContentRevisionQuery = z.infer<typeof contentRevisionQuerySchema>
export type ContentRevisionCreate = z.infer<typeof contentRevisionCreateSchema>
export type ContentRevisionUpdate = z.infer<typeof contentRevisionUpdateSchema>
export type ContentRevisionRevert = z.infer<typeof contentRevisionRevertSchema>
export type ParamsId = z.infer<typeof paramsSchema>
