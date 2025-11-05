// server/schemas/world.ts
import { z } from 'zod'

export const createWorldSchema = z.object({
  code: z.string().min(1),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  name: z.string().min(2),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export const updateWorldSchema = z.object({
  code: z.string().min(1).optional(),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  name: z.string().min(2).optional(),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})
