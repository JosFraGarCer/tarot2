// shared/schemas/entities/world-card.ts
import { z } from 'zod'
import { translationFields, languageCodeWithDefault, effectsSchema, cardStatusSchema } from '../common'

// Schema completo para WorldCard
export const worldCardSchema = z.object({
  id: z.number().int().positive(),
  world_id: z.number().int().positive(),
  base_card_id: z.number().int().nullable().optional(),
  code: z.string().min(1, 'Code is required'),
  image: z.string().url().nullable().optional(),
  is_override: z.boolean().nullable().optional(),
  is_active: z.boolean().default(true),
  legacy_effects: z.boolean().default(false),
  effects: effectsSchema,
  created_at: z.string(),
  modified_at: z.string(),
  status: cardStatusSchema.default('draft'),
  created_by: z.number().int().nullable().optional(),
  updated_by: z.number().int().nullable().optional(),
  content_version_id: z.number().int().nullable().optional(),
  name: z.string().min(2, 'Name must have at least 2 characters'),
  short_text: translationFields.short_text,
  description: translationFields.description,
  language_code: translationFields.language_code,
})

// Schema para creación
export const worldCardCreateSchema = z.object({
  world_id: z.coerce.number().int().positive(),
  base_card_id: z.coerce.number().int().nullable().optional(),
  code: z.string().min(1, 'Code is required'),
  image: z.string().url().nullable().optional(),
  is_override: z.boolean().nullable().optional(),
  is_active: z.boolean().optional(), // has DEFAULT in DB
  legacy_effects: z.coerce.boolean().optional(), // has DEFAULT in DB
  effects: effectsSchema.optional(), // has DEFAULT in DB
  metadata: z.record(z.string(), z.any()).nullable().optional(), // has DEFAULT in DB
  lang: languageCodeWithDefault('en'),
  name: z.string().min(2, 'Name must have at least 2 characters'),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

// Schema para actualización
export const worldCardUpdateSchema = z.object({
  world_id: z.coerce.number().int().positive().optional(),
  base_card_id: z.coerce.number().int().nullable().optional(),
  code: z.string().min(1, 'Code is required').optional(),
  image: z.string().url().nullable().optional(),
  is_override: z.boolean().nullable().optional(),
  is_active: z.boolean().optional(),
  legacy_effects: z.coerce.boolean().optional(),
  effects: effectsSchema.optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
  lang: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  name: z.string().min(2, 'Name must have at least 2 characters').optional(),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

// Schema para consulta
export const worldCardQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(150).optional(),
  q: z.string().min(1).max(150).optional(),
  status: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  created_by: z.coerce.number().int().optional(),
  world_id: z.coerce.number().int().optional(),
  base_card_id: z.coerce.number().int().optional(),
  sort: z.enum(['created_at', 'modified_at', 'code', 'status', 'name', 'is_active', 'created_by', 'world_id', 'base_card_id']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  lang: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  language: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  locale: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
})

// Types exportados
export type WorldCard = z.infer<typeof worldCardSchema>
export type WorldCardCreate = z.infer<typeof worldCardCreateSchema>
export type WorldCardUpdate = z.infer<typeof worldCardUpdateSchema>
export type WorldCardQuery = z.infer<typeof worldCardQuerySchema>
