// server/schemas/world-card.ts
import { z } from 'zod'

export const createWorldCardSchema = z.object({
  code: z.string().min(1),
  world_id: z.coerce.number().int().positive(),
  base_card_id: z.coerce.number().int().positive().optional(),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  is_override: z.coerce.boolean().optional(),
  name: z.string().min(2),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export const updateWorldCardSchema = z.object({
  code: z.string().min(1).optional(),
  world_id: z.coerce.number().int().positive().optional(),
  base_card_id: z.coerce.number().int().positive().nullable().optional(),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  is_override: z.coerce.boolean().optional(),
  name: z.string().min(2).optional(),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})
