// server/schemas/content-revision.ts
import { z } from 'zod'

const entityTypeEnum = z.enum([
  'arcana',
  'facet',
  'base_card',
  'base_card_type',
  'world_card',
  'world',
  'base_skills',
])

function parseJsonValue(value: unknown, field: string, defaultValue?: Record<string, unknown> | null) {
  if (value === undefined) return defaultValue
  if (value === null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return defaultValue ?? {}
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>
      }
      throw new Error('Not an object')
    } catch (err) {
      throw new z.ZodError([
        {
          path: [field],
          message: 'Must be valid JSON object',
          code: z.ZodIssueCode.custom,
        },
      ])
    }
  }
  if (typeof value === 'object') return value as Record<string, unknown>
  throw new z.ZodError([
    {
      path: [field],
      message: 'Must be valid JSON object',
      code: z.ZodIssueCode.custom,
    },
  ])
}

const jsonObject = (field: string, options?: { defaultValue?: Record<string, unknown> | null }) =>
  z
    .any()
    .optional()
    .transform((value) => parseJsonValue(value, field, options?.defaultValue))

export const contentRevisionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  entity_type: entityTypeEnum.optional(),
  entity_id: z.coerce.number().int().optional(),
  version_number: z.coerce.number().int().optional(),
  status: z.string().optional(),
  language_code: z.string().max(5).optional(),
  content_version_id: z.coerce.number().int().optional(),
  created_by: z.coerce.number().int().optional(),
  sort: z
    .enum(['created_at', 'version_number', 'status'])
    .optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})

export const contentRevisionCreateSchema = z.object({
  entity_type: entityTypeEnum,
  entity_id: z.number().int(),
  version_number: z.number().int().min(1),
  diff: jsonObject('diff', { defaultValue: {} }),
  notes: z.string().optional(),
  status: z.string().optional(),
  language_code: z.string().max(5).optional(),
  content_version_id: z.number().int().optional(),
  prev_snapshot: jsonObject('prev_snapshot', { defaultValue: null }),
  next_snapshot: jsonObject('next_snapshot', { defaultValue: null }),
})

export const contentRevisionUpdateSchema = z.object({
  diff: jsonObject('diff'),
  notes: z.string().nullable().optional(),
  status: z.string().optional(),
  language_code: z.string().max(5).nullable().optional(),
  version_number: z.number().int().min(1).optional(),
  content_version_id: z.number().int().nullable().optional(),
  prev_snapshot: jsonObject('prev_snapshot'),
  next_snapshot: jsonObject('next_snapshot'),
})

export const contentRevisionRevertSchema = z.object({
  notes: z.string().nullable().optional(),
})

export type ContentRevisionQuery = z.infer<typeof contentRevisionQuerySchema>
export type ContentRevisionCreate = z.infer<typeof contentRevisionCreateSchema>
export type ContentRevisionUpdate = z.infer<typeof contentRevisionUpdateSchema>
export type ContentRevisionRevert = z.infer<typeof contentRevisionRevertSchema>
