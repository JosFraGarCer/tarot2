// shared/schemas/editorial-state.ts
import { z } from 'zod'
import { cardStatusSchema } from './common'

export const editorialStateSchema = z.object({
  id: z.number().int(),
  entity_type: z.number().int(),
  entity_id: z.number().int(),
  status: cardStatusSchema,
  is_active: z.boolean(),
  content_version_id: z.number().int().nullable(),
  created_by: z.number().int().nullable(),
  updated_by: z.number().int().nullable(),
  created_at: z.string(),
  modified_at: z.string(),
})

export type EditorialStateResponse = z.infer<typeof editorialStateSchema>

export const editorialStateQuerySchema = z.object({
  entity_code: z.string().min(1),
  entity_id: z.coerce.number().int().positive(),
})

export type EditorialStateQuery = z.infer<typeof editorialStateQuerySchema>
