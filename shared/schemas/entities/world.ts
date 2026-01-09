// app/schemas/entities/world.ts
// /app/schemas/entities/world.ts
import { z } from 'zod'

const statusEnum = z.enum([
  'draft',
  'review',
  'pending_review',
  'changes_requested',
  'translation_review',
  'approved',
  'published',
  'rejected',
  'archived',
])

const commonOptional = {
  short_text: z.string().max(1000).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  language_code: z.string().min(2).max(10).optional().nullable(),
  image: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
  sort: z.number().int().optional().nullable(),
  status: statusEnum.optional(),
  created_by: z.number().int().optional().nullable(),
  content_version_id: z.number().int().optional().nullable(),
}

export const worldCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  ...commonOptional,
})

export const worldUpdateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).optional(),
  ...commonOptional,
})

export type WorldCreateInput = z.infer<typeof worldCreateSchema>
export type WorldUpdateInput = z.infer<typeof worldUpdateSchema>
