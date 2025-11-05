// server/schemas/base-card.ts
import { z } from 'zod'

export const createBaseCardSchema = z.object({
  code: z.string().min(1),
  card_type_id: z.coerce.number().int().positive(),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  name: z.string().min(2),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export const updateBaseCardSchema = z.object({
  code: z.string().min(1).optional(),
  card_type_id: z.coerce.number().int().positive().optional(),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  name: z.string().min(2).optional(),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})
