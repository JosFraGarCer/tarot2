// shared/schemas/translation-state.ts
import { z } from 'zod'

export const translationStatusEnum = z.enum([
  'draft',
  'review',
  'approved',
  'rejected',
])

export type TranslationStatus = z.infer<typeof translationStatusEnum>

export const translationStateSchema = z.object({
  entity_type: z.number().int(),
  entity_id: z.number().int(),
  language_code: z.string(),
  status: translationStatusEnum,
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.number().int().nullable(),
  updated_by: z.number().int().nullable(),
})

export type TranslationStateResponse = z.infer<typeof translationStateSchema>

export const translationStateQuerySchema = z.object({
  entity_code: z.string().min(1),
  entity_id: z.coerce.number().int().positive(),
  language_code: z.string().min(2).max(10),
})

export type TranslationStateQuery = z.infer<typeof translationStateQuerySchema>
