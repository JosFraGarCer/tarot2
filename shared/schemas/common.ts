// shared/schemas/common.ts
import { z } from 'zod'

// Enums desde PostgreSQL como fuente de verdad
export const CardStatusEnum = [
  'draft',
  'approved', 
  'archived',
  'review',
  'pending_review',
  'changes_requested',
  'translation_review',
  'rejected',
  'published'
] as const

export type CardStatus = typeof CardStatusEnum[number]

// Schemas base unificados
export const cardStatusSchema = z.enum(CardStatusEnum)

export const languageCodeSchema = z
  .string()
  .min(2)
  .max(10)
  .regex(/^[a-z]{2}(-[A-Z]{2})?$/)
  .transform((val) => val.toLowerCase())

export const optionalLanguageCodeSchema = languageCodeSchema.optional()

// Helper para coerceBoolean que maneja correctamente 'true'/'false' strings
// z.coerce.boolean() convierte cualquier string no vacío a true, incluyendo 'false'
export const coerceBoolean = z.union([
  z.boolean(),
  z.literal('true'),
  z.literal('false'),
]).transform((val) => val === true || val === 'true')

export const languageCodeWithDefault = (defaultValue = 'en') => 
  languageCodeSchema.default(defaultValue)

// Campos comunes de entidades
export const baseEntityFields = {
  id: z.number().int().positive(),
  code: z.string().min(1),
  image: z.string().url().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  modified_at: z.string(),
  status: cardStatusSchema.default('draft'),
  created_by: z.number().int().nullable().optional(),
  content_version_id: z.number().int().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
}

// Campos de traducción comunes
export const translationFields = {
  name: z.string().min(2, 'Name must have at least 2 characters'),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  language_code: optionalLanguageCodeSchema,
}

// Efectos (JSONB) - Puede ser array u objeto para efectos narrativos
export const effectsSchema = z.union([
  z.array(z.record(z.string(), z.unknown())),
  z.record(z.string(), z.unknown())
]).nullable().optional()

// Utilidades de consulta
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(150).optional(),
  q: z.string().min(1).max(150).optional(),
  sort: z.string().optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})
