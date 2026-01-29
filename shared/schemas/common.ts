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

// Tipo para el usuario autenticado en el contexto de H3
export interface AuthenticatedUser {
  id: number
  username: string
  email: string
  status: string
  roles: Array<{ id: number; name: string; permissions: Record<string, boolean> }>
  permissions: Record<string, boolean>
}

// Campos comunes de entidades para creación/actualización (con defaults explícitos)
export const baseEntityCreateFields = {
  code: z.string().min(1),
  image: z.string().url().nullable().optional(),
  is_active: z.boolean().default(true),
  status: cardStatusSchema.default('draft'),
  metadata: z.record(z.string(), z.unknown()).nullable().optional().default({}),
}

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

// Helper para unificar parámetros de idioma en schemas de consulta
export const withLanguageTransform = <T extends { lang?: string; language?: string; locale?: string }>(data: T) => {
  const lang = data.lang || data.language || data.locale
  return {
    ...data,
    lang,
  }
}

// Raw query object definition to allow extension
export const baseQueryFields = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(150).optional(),
  q: z.string().min(1).max(150).optional(),
  sort: z.string().optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  lang: z.string().min(2).max(10).optional(),
  language: z.string().min(2).max(10).optional(),
  locale: z.string().min(2).max(10).optional(),
}

export const baseQuerySchema = z.object(baseQueryFields).transform(withLanguageTransform)

// Tipos para utilidades de consulta
export type BaseQuery = z.infer<typeof baseQuerySchema>
