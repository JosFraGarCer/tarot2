// server/schemas/tag.ts
import { z } from 'zod'
import { queryBoolean } from '../utils/zod'

export const tagQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
  q: z.string().optional(),
  search: z.string().optional(),
  is_active: queryBoolean.optional(),
  category: z.string().optional(),
  parent_id: z.coerce.number().int().optional(),
  lang: z.string().optional(),
  sort: z
    .enum(['created_at', 'modified_at', 'code', 'category', 'name', 'is_active', 'created_by'])
    .optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})

export const tagCreateSchema = z.object({
  code: z.string().min(1),
  category: z.string().optional(),
  parent_id: z.number().nullable().optional(),
  sort: z.number().int().optional(),
  is_active: z.boolean().default(true),
  created_by: z.number().optional(),
  // initial translation (en)
  name: z.string().min(1),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export const tagUpdateSchema = z.object({
  code: z.string().min(1).optional(),
  category: z.string().optional(),
  parent_id: z.number().nullable().optional(),
  sort: z.number().int().optional(),
  is_active: z.boolean().optional(),
  created_by: z.number().optional(),
  // translation fields for provided lang
  name: z.string().min(1).optional(),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})
