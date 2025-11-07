// /app/schemas/entities/tag.ts
import { z } from 'zod'

export const tagCreateSchema = z.object({
  code: z.string().min(1),
  category: z.string().min(1),
  name: z.string().min(1),
  short_text: z.string().max(1000).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  parent_id: z.number().int().optional().nullable(),
  is_active: z.boolean().optional(),
  sort: z.number().int().optional().nullable(),
})

export const tagUpdateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  short_text: z.string().max(1000).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  parent_id: z.number().int().optional().nullable(),
  is_active: z.boolean().optional(),
  sort: z.number().int().optional().nullable(),
})
