// shared/schemas/entities/facet.ts
import { z } from 'zod'
import { baseEntityFields, translationFields, languageCodeWithDefault, effectsSchema, cardStatusSchema } from '../common'

// Schema completo para Facet
export const facetSchema = z.object({
  ...baseEntityFields,
  arcana_id: z.number().int().positive(),
  legacy_effects: z.boolean().default(false),
  effects: effectsSchema,
  name: z.string().min(2, 'Name must have at least 2 characters'),
  short_text: translationFields.short_text,
  description: translationFields.description,
  language_code: translationFields.language_code,
})

// Schema para creación
export const facetCreateSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  arcana_id: z.coerce.number().int().positive(),
  image: z.string().url().nullable().optional(),
  status: cardStatusSchema.optional(), // Use common schema instead of custom enum
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
export const facetUpdateSchema = z.object({
  code: z.string().min(1, 'Code is required').optional(),
  arcana_id: z.coerce.number().int().positive().optional(),
  image: z.string().url().nullable().optional(),
  status: cardStatusSchema.optional(), // Use common schema instead of custom enum
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
export const facetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(150).optional(),
  q: z.string().min(1).max(150).optional(),
  status: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  created_by: z.coerce.number().int().optional(),
  arcana_id: z.coerce.number().int().optional(),
  sort: z.enum(['created_at', 'modified_at', 'code', 'status', 'name', 'is_active', 'created_by', 'arcana_id']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  lang: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  language: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  locale: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
})

// Types exportados
export type Facet = z.infer<typeof facetSchema>
export type FacetCreate = z.infer<typeof facetCreateSchema>
export type FacetUpdate = z.infer<typeof facetUpdateSchema>
export type FacetQuery = z.infer<typeof facetQuerySchema>
