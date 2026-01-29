// shared/schemas/entities/world.ts
import { z } from 'zod'
import { baseEntityFields, translationFields, languageCodeWithDefault, cardStatusSchema, coerceBoolean } from '../common'

// Schema completo para World
export const worldSchema = z.object({
  ...baseEntityFields,
  name: z.string().min(2, 'Name must have at least 2 characters'),
  short_text: translationFields.short_text,
  description: translationFields.description,
  language_code: translationFields.language_code,
})

// Schema para creación
export const worldCreateSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  image: z.string().url().nullable().optional(),
  status: cardStatusSchema.optional(), // Use common schema instead of custom enum
  is_active: z.boolean().optional(), // has DEFAULT in DB
  metadata: z.record(z.string(), z.any()).nullable().optional(), // has DEFAULT in DB
  lang: languageCodeWithDefault('en'),
  name: z.string().min(2, 'Name must have at least 2 characters'),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

// Schema para actualización
export const worldUpdateSchema = z.object({
  code: z.string().min(1, 'Code is required').optional(),
  image: z.string().url().nullable().optional(),
  status: cardStatusSchema.optional(), // Use common schema instead of custom enum
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
  lang: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  name: z.string().min(2, 'Name must have at least 2 characters').optional(),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

// Schema para consulta
export const worldQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(150).optional(),
  q: z.string().min(1).max(150).optional(),
  status: z.string().optional(),
  is_active: coerceBoolean.optional(),
  tag_ids: z.union([z.coerce.number().int(), z.array(z.coerce.number().int())]).optional(),
  created_by: z.coerce.number().int().optional(),
  sort: z.enum(['created_at', 'modified_at', 'code', 'status', 'name', 'is_active', 'created_by']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  lang: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  language: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  locale: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
})

// Types exportados
export type World = z.infer<typeof worldSchema>
export type WorldCreate = z.infer<typeof worldCreateSchema>
export type WorldUpdate = z.infer<typeof worldUpdateSchema>
export type WorldQuery = z.infer<typeof worldQuerySchema>
