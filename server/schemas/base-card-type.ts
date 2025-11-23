// server/schemas/base-card-type.ts
import { z } from 'zod'
import { queryBoolean } from '../utils/zod'
import {
  languageCodeWithDefault,
  optionalLanguageCodeSchema,
  sortDirectionSchema,
} from './common'

const sortFields = ['created_at', 'modified_at', 'code', 'status', 'name', 'is_active', 'created_by'] as const

export const baseCardTypeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(120).optional(),
  q: z.string().min(1).max(120).optional(),
  status: z.string().optional(),
  is_active: queryBoolean.optional(),
  created_by: z.coerce.number().int().optional(),
  sort: z.enum(sortFields).optional(),
  direction: sortDirectionSchema,
  lang: optionalLanguageCodeSchema,
  language: optionalLanguageCodeSchema,
  locale: optionalLanguageCodeSchema,
})

const translationFields = {
  name: z.string().min(2, 'Name must contain at least 2 characters'),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
}

export const baseCardTypeCreateSchema = z.object({
  code: z.string().min(1),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  is_active: z.boolean().optional(),
  lang: languageCodeWithDefault('en'),
  ...translationFields,
})

export const baseCardTypeUpdateSchema = z.object({
  code: z.string().min(1).optional(),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  is_active: z.boolean().optional(),
  lang: optionalLanguageCodeSchema,
  name: translationFields.name.optional(),
  short_text: translationFields.short_text,
  description: translationFields.description,
})

export const createBaseCardTypeSchema = baseCardTypeCreateSchema
export const updateBaseCardTypeSchema = baseCardTypeUpdateSchema
