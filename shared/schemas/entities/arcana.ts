import { z } from 'zod'

export const statusEnum = z.enum([
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

export const arcanaQuerySchema = z.object({
  search: z.string().optional(),
  q: z.string().optional(),
  status: statusEnum.optional(),
  is_active: z.coerce.boolean().optional(),
  created_by: z.coerce.number().int().optional(),
  sort: z.string().optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  tags: z.array(z.string()).optional(),
  tag_ids: z.array(z.coerce.number().int()).optional(),
})

const commonOptional = {
  short_text: z.string().max(1000).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  language_code: z.string().min(2).max(10).optional().nullable(),
  lang: z.string().min(2).max(10).optional().nullable(),
  image: z.string().url().optional().nullable(),
  is_active: z.boolean().optional(),
  sort: z.number().int().optional().nullable(),
  status: statusEnum.optional(),
  created_by: z.number().int().optional().nullable(),
  content_version_id: z.number().int().optional().nullable(),
  legacy_effects: z.boolean().optional(),
  effects: z.record(z.string(), z.array(z.string())).optional().nullable(),
}

export const arcanaCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  ...commonOptional,
})

export const arcanaUpdateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).optional(),
  ...commonOptional,
})
