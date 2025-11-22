// server/schemas/base-skills.ts
import { z } from 'zod'

const effectsSchema = z.record(z.string(), z.array(z.string())).nullable()

export const createBaseSkillsSchema = z.object({
  code: z.string().min(1),
  facet_id: z.coerce.number().int().positive(),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  legacy_effects: z.coerce.boolean().optional(),
  effects: effectsSchema.optional(),
  name: z.string().min(2),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export const updateBaseSkillsSchema = z.object({
  code: z.string().min(1).optional(),
  facet_id: z.coerce.number().int().positive().optional(),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  legacy_effects: z.coerce.boolean().optional(),
  effects: effectsSchema.optional(),
  name: z.string().min(2).optional(),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})
