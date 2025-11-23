// server/schemas/world-card.ts
import { z } from 'zod'
import { queryBoolean } from '../utils/zod'
import {
  languageCodeWithDefault,
  numberArrayParam,
  optionalLanguageCodeSchema,
  sortDirectionSchema,
  stringArrayParam,
} from './common'

const effectsSchema = z.record(z.string(), z.array(z.string())).nullable().optional()

const worldCardSortFields = [
  'created_at',
  'modified_at',
  'code',
  'status',
  'name',
  'is_active',
  'created_by',
  'world_id',
  'base_card_id',
] as const

export const worldCardQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).max(150).optional(),
  q: z.string().min(1).max(150).optional(),
  status: z.string().optional(),
  is_active: queryBoolean.optional(),
  created_by: z.coerce.number().int().optional(),
  world_id: z.coerce.number().int().optional(),
  base_card_id: z.coerce.number().int().optional(),
  tags: stringArrayParam,
  tag_ids: numberArrayParam,
  sort: z.enum(worldCardSortFields).optional(),
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

export const worldCardCreateSchema = z.object({
  code: z.string().min(1),
  world_id: z.coerce.number().int().positive(),
  base_card_id: z.coerce.number().int().positive().optional(),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  is_active: z.boolean().optional(),
  is_override: z.coerce.boolean().optional(),
  legacy_effects: z.coerce.boolean().optional(),
  effects: effectsSchema,
  lang: languageCodeWithDefault('en'),
  ...translationFields,
})

export const worldCardUpdateSchema = z.object({
  code: z.string().min(1).optional(),
  world_id: z.coerce.number().int().positive().optional(),
  base_card_id: z.coerce.number().int().positive().nullable().optional(),
  image: z.string().nullable().optional(),
  status: z.string().optional(),
  is_active: z.boolean().optional(),
  is_override: z.coerce.boolean().optional(),
  legacy_effects: z.coerce.boolean().optional(),
  effects: effectsSchema,
  lang: optionalLanguageCodeSchema,
  name: translationFields.name.optional(),
  short_text: translationFields.short_text,
  description: translationFields.description,
})

export const createWorldCardSchema = worldCardCreateSchema
export const updateWorldCardSchema = worldCardUpdateSchema
