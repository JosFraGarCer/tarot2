// server/schemas/base-card-type.ts
import { z } from 'zod'

export const createBaseCardTypeSchema = z.object({
  code: z.string().min(1),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  is_active: z.boolean().optional(),
  name: z.string().min(2),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export const updateBaseCardTypeSchema = z.object({
  code: z.string().min(1).optional(),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  is_active: z.boolean().optional(),
  name: z.string().min(2).optional(),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})
