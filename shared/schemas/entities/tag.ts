// shared/schemas/entities/tag.ts
import { z } from 'zod'
import { baseEntityFields, translationFields, languageCodeWithDefault, cardStatusSchema, coerceBoolean, baseQueryFields, withLanguageTransform, baseEntityCreateFields } from '../common'

// Schema completo para Tag
export const tagSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().min(1, 'Code is required'),
  category: z.string().min(1, 'Category is required'),
  parent_id: z.number().int().nullable().optional(),
  is_active: z.boolean().default(true),
  sort: z.number().int().default(0),
  created_at: z.string(),
  modified_at: z.string(),
  created_by: z.number().int().nullable().optional(),
  updated_by: z.number().int().nullable().optional(),
  name: z.string().min(2, 'Name must have at least 2 characters'),
  short_text: translationFields.short_text,
  description: translationFields.description,
  language_code: translationFields.language_code,
})

// Schema para creación (con defaults explícitos)
export const tagCreateSchema = z.object({
  ...baseEntityCreateFields,
  category: z.string().min(1, 'Category is required'),
  parent_id: z.coerce.number().int().nullable().optional(),
  sort: z.number().int().optional().default(0),
  lang: languageCodeWithDefault('en'),
  name: z.string().min(2, 'Name must have at least 2 characters'),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

// Schema para actualización
export const tagUpdateSchema = z.object({
  code: z.string().min(1, 'Code is required').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  parent_id: z.coerce.number().int().nullable().optional(),
  is_active: z.boolean().optional(),
  sort: z.number().int().optional(),
  lang: z.string().min(2, 'Language code must have at least 2 characters').max(10).optional(),
  name: z.string().min(2, 'Name must have at least 2 characters').optional(),
  short_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

// Schema para consulta
export const tagQuerySchema = z.object({
  ...baseQueryFields,
  category: z.string().optional(),
  parent_id: z.coerce.number().int().optional(),
  parent_only: coerceBoolean.optional(),
  is_active: coerceBoolean.optional(),
  created_by: z.coerce.number().int().optional(),
  sort: z.enum(['created_at', 'modified_at', 'code', 'category', 'name', 'is_active', 'created_by', 'parent_id']).optional(),
}).transform(withLanguageTransform)

// Schema for batch operations
export const tagBatchSchema = z
  .object({
    ids: z.array(z.coerce.number().int()).min(1),
    is_active: coerceBoolean.optional(),
    category: z.string().optional(),
    parent_id: z.coerce.number().int().nullable().optional(),
    sort: z.coerce.number().int().optional(),
    name: z.string().min(1).optional(),
    short_text: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  })
  .refine((payload) => {
    const { ids, ...rest } = payload
    return Object.keys(rest).length > 0
  }, 'No fields to update')

// Schema for import operations
export const tagImportSchema = z.object({
  // Define the import schema structure - can be extended as needed
  data: z.array(z.record(z.string(), z.unknown())).min(1, 'At least one item to import'),
})

// Types exportados
export type Tag = z.infer<typeof tagSchema>
export type TagCreate = z.infer<typeof tagCreateSchema>
export type TagUpdate = z.infer<typeof tagUpdateSchema>
export type TagQuery = z.infer<typeof tagQuerySchema>
export type TagBatch = z.infer<typeof tagBatchSchema>
export type TagImport = z.infer<typeof tagImportSchema>

// Legacy aliases for backward compatibility
export const tagLangQuerySchema = tagQuerySchema
