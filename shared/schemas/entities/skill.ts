// shared/schemas/entities/skill.ts
import { z } from 'zod'
import { baseEntityFields, translationFields, languageCodeWithDefault, effectsSchema, cardStatusSchema, coerceBoolean } from '../common'

// Schema completo para Skill
export const skillSchema = z.object({
  ...baseEntityFields,
  facet_id: z.number().int().positive(),
  sort: z.number().int().default(0),
  legacy_effects: z.boolean().default(false),
  effects: effectsSchema,
  name: z.string().min(2, 'Name must have at least 2 characters'),
  short_text: translationFields.short_text,
  description: translationFields.description,
  language_code: translationFields.language_code,
})

// Schema para creación
export const skillCreateSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  facet_id: z.coerce.number().int().positive(),
  image: z.string().url().nullable().optional(),
  status: cardStatusSchema.optional(), // Use common schema instead of custom enum
  is_active: z.boolean().optional(), // has DEFAULT in DB
  sort: z.number().int().optional(), // has DEFAULT in DB
  legacy_effects: z.coerce.boolean().optional(), // has DEFAULT in DB
  effects: effectsSchema.optional(), // has DEFAULT in DB
  metadata: z.record(z.string(), z.any()).nullable().optional(), // has DEFAULT in DB
  lang: languageCodeWithDefault('en'),
  name: z.string().min(2, 'Name must have at least 2 characters'),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

// Schema para actualización
export const skillUpdateSchema = z.object({
  code: z.string().min(1, 'Code is required').optional(),
  facet_id: z.coerce.number().int().positive().optional(),
  image: z.string().url().nullable().optional(),
  status: cardStatusSchema.optional(), // Use common schema instead of custom enum
  is_active: z.boolean().optional(),
  sort: z.number().int().optional(),
  legacy_effects: z.coerce.boolean().optional(),
  effects: effectsSchema.optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
  lang: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  name: z.string().min(2, 'Name must have at least 2 characters').optional(),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

// Schema para consulta
export const skillQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(150).optional(),
  q: z.string().min(1).max(150).optional(),
  status: z.string().optional(),
  is_active: coerceBoolean.optional(),
  tag_ids: z.union([z.coerce.number().int(), z.array(z.coerce.number().int())]).optional(),
  created_by: z.coerce.number().int().optional(),
  facet_id: z.coerce.number().int().optional(),
  sort: z.enum(['created_at', 'modified_at', 'code', 'status', 'name', 'is_active', 'created_by', 'facet_id']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  lang: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  language: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  locale: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
})

// Types exportados
export type Skill = z.infer<typeof skillSchema>
export type SkillCreate = z.infer<typeof skillCreateSchema>
export type SkillUpdate = z.infer<typeof skillUpdateSchema>
export type SkillQuery = z.infer<typeof skillQuerySchema>
