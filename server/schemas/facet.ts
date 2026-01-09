// server/schemas/facet.ts
import { z } from 'zod'
import { queryBoolean } from '../utils/zod'
import {
  languageCodeWithDefault,
  numberArrayParam,
  optionalLanguageCodeSchema,
  singleOrArrayNumberParam,
  sortDirectionSchema,
  stringArrayParam,
} from './common'

const effectsSchema = z.record(z.string(), z.array(z.string())).nullable().optional()

const sortFields = [
  'created_at',
  'modified_at',
  'code',
  'status',
  'name',
  'is_active',
  'created_by',
  'arcana_id',
] as const

export const facetQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(150).optional(),
  q: z.string().min(1).max(150).optional(),
  status: z.string().optional(),
  is_active: queryBoolean.optional(),
  created_by: z.coerce.number().int().optional(),
  arcana_id: singleOrArrayNumberParam,
  tags: stringArrayParam,
  tag_ids: numberArrayParam,
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

export const facetCreateSchema = z.object({
  code: z.string().min(1),
  arcana_id: z.coerce.number().int().positive(),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  is_active: z.boolean().optional(),
  legacy_effects: z.coerce.boolean().optional(),
  effects: effectsSchema,
  lang: languageCodeWithDefault('en'),
  ...translationFields,
})

export const facetUpdateSchema = z.object({
  code: z.string().min(1).optional(),
  arcana_id: z.coerce.number().int().positive().optional(),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  is_active: z.boolean().optional(),
  legacy_effects: z.coerce.boolean().optional(),
  effects: effectsSchema,
  lang: optionalLanguageCodeSchema,
  name: translationFields.name.optional(),
  short_text: translationFields.short_text,
  description: translationFields.description,
})

export const createFacetSchema = facetCreateSchema
export const updateFacetSchema = facetUpdateSchema
