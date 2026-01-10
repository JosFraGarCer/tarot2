// shared/schemas/entities/base-card.ts
import { z } from 'zod'
import { baseEntityFields, translationFields, languageCodeWithDefault, effectsSchema, cardStatusSchema } from '../common'

// Schema completo para BaseCard
export const baseCardSchema = z.object({
  ...baseEntityFields,
  card_type_id: z.number().int().positive(),
  card_family: z.string().optional(),
  legacy_effects: z.boolean().default(false),
  effects: effectsSchema,
  name: z.string().min(1),
  short_text: translationFields.short_text,
  description: translationFields.description,
  language_code: translationFields.language_code,
})

// Schema para creación
export const baseCardCreateSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  card_type_id: z.coerce.number().int().positive(),
  card_family: z.string().optional(), // Make optional as test expects
  image: z.string().url().nullable().optional(),
  status: cardStatusSchema.optional(), // Use common schema instead of custom enum
  is_active: z.boolean().optional(), // has DEFAULT in DB
  legacy_effects: z.coerce.boolean().optional(), // has DEFAULT in DB
  effects: effectsSchema.optional(), // has DEFAULT in DB
  metadata: z.record(z.string(), z.any()).nullable().optional(), // has DEFAULT in DB
  lang: languageCodeWithDefault('en'),
  name: z.string().min(2, 'Name must contain at least 2 characters'),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

// Schema para actualización
export const baseCardUpdateSchema = z.object({
  code: z.string().min(1).optional(),
  card_type_id: z.coerce.number().int().positive().optional(),
  card_family: z.string().min(1).optional(), // Add to update schema
  image: z.string().url().nullable().optional(),
  status: cardStatusSchema.optional(), // Use common schema instead of custom enum
  is_active: z.boolean().optional(),
  legacy_effects: z.coerce.boolean().optional(),
  effects: effectsSchema.optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
  lang: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  name: z.string().min(2, 'Name must contain at least 2 characters').optional(),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

// Schema para consulta
export const baseCardQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(150).optional(),
  q: z.string().min(1).max(150).optional(),
  status: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  created_by: z.coerce.number().int().optional(),
  card_type_id: z.coerce.number().int().optional(),
  sort: z.enum(['created_at', 'modified_at', 'code', 'status', 'name', 'is_active', 'created_by', 'card_type_id']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  lang: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  language: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  locale: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
})

// Types exportados
export type BaseCard = z.infer<typeof baseCardSchema>
export type BaseCardCreate = z.infer<typeof baseCardCreateSchema>
export type BaseCardUpdate = z.infer<typeof baseCardUpdateSchema>
export type BaseCardQuery = z.infer<typeof baseCardQuerySchema>
