// shared/schemas/entities/arcana.ts
import { z } from 'zod'
import { baseEntityFields, translationFields, languageCodeWithDefault, cardStatusSchema, coerceBoolean, baseQueryFields, withLanguageTransform, baseEntityCreateFields } from '../common'

// Schema completo para Arcana (unificado frontend/backend)
export const arcanaSchema = z.object({
  ...baseEntityFields,
  sort: z.number().int().default(0),
  name: z.string().min(2, 'Name must have at least 2 characters'),
  short_text: translationFields.short_text,
  description: translationFields.description,
  language_code: translationFields.language_code,
})

// Schema para creación (con defaults explícitos)
export const arcanaCreateSchema = z.object({
  ...baseEntityCreateFields,
  sort: z.number().int().optional().default(0),
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
  ...baseQueryFields,
  status: z.string().optional(),
  is_active: coerceBoolean.optional(),
  tag_ids: z.union([z.coerce.number().int(), z.array(z.coerce.number().int())]).optional(),
  created_by: z.coerce.number().int().optional(),
  sort: z.enum(['created_at', 'modified_at', 'code', 'status', 'name', 'is_active', 'created_by']).optional(),
}).transform(withLanguageTransform)

// Types exportados
export type Arcana = z.infer<typeof arcanaSchema>
export type ArcanaCreate = z.infer<typeof arcanaCreateSchema>
export type ArcanaUpdate = z.infer<typeof arcanaUpdateSchema>
export type ArcanaQuery = z.infer<typeof arcanaQuerySchema>
