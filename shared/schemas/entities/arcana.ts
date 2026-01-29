// shared/schemas/entities/arcana.ts
import { z } from 'zod'
import { baseEntityFields, translationFields, languageCodeWithDefault, cardStatusSchema, coerceBoolean } from '../common'

// Schema completo para Arcana (unificado frontend/backend)
export const arcanaSchema = z.object({
  ...baseEntityFields,
  sort: z.number().int().default(0),
  name: z.string().min(2, 'Name must have at least 2 characters'),
  short_text: translationFields.short_text,
  description: translationFields.description,
  language_code: translationFields.language_code,
})

// Schema para creación (con defaults)
export const arcanaCreateSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  image: z.string().url().nullable().optional(),
  status: cardStatusSchema.optional(), // Use common schema instead of custom enum
  is_active: z.boolean().optional(), // has DEFAULT in DB
  sort: z.number().int().optional(), // has DEFAULT in DB
  metadata: z.record(z.string(), z.any()).nullable().optional(), // has DEFAULT in DB
  lang: languageCodeWithDefault('en'),
  name: z.string().min(2, 'Name must have at least 2 characters'),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

// Schema para actualización (todos opcionales excepto name)
export const arcanaUpdateSchema = z.object({
  code: z.string().min(1, 'Code is required').optional(),
  image: z.string().url().nullable().optional(),
  status: cardStatusSchema.optional(), // Use common schema instead of custom enum
  is_active: z.boolean().optional(),
  sort: z.number().int().optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
  lang: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  name: z.string().min(2, 'Name must have at least 2 characters').optional(),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

// Schema para consulta/paginación
export const arcanaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(120).optional(),
  q: z.string().min(1).max(120).optional(),
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
export type Arcana = z.infer<typeof arcanaSchema>
export type ArcanaCreate = z.infer<typeof arcanaCreateSchema>
export type ArcanaUpdate = z.infer<typeof arcanaUpdateSchema>
export type ArcanaQuery = z.infer<typeof arcanaQuerySchema>
