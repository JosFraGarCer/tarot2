// shared/schemas/tag-link.ts
import { z } from 'zod'

// Entity types that can have tags
export const tagLinkEntityTypeEnum = z.enum([
  'base_card',
  'world_card',
  'base_card_type',
  'base_skills',
  'facet',
  'arcana',
  'world'
])

// Schema for transforming single ID or array of IDs to array
export const idListSchema = z
  .union([
    z.coerce.number().int().min(1),
    z.array(z.coerce.number().int().min(1)).nonempty(),
  ])
  .transform((value) => (Array.isArray(value) ? value : [value]))
  .transform((values) => Array.from(new Set(values)))

// Schema for attaching tags to entities
export const tagLinksAttachSchema = z.object({
  entity_type: tagLinkEntityTypeEnum,
  entity_ids: idListSchema,
  tag_ids: idListSchema,
})

// Schema for detaching tags from entities
export const tagLinksDetachSchema = tagLinksAttachSchema

// Schema for querying tag links
export const tagLinkQuerySchema = z.object({
  entity_type: tagLinkEntityTypeEnum.optional(),
  entity_id: z.coerce.number().int().optional(),
  tag_id: z.coerce.number().int().optional(),
  created_by: z.coerce.number().int().optional(),
  sort: z.enum(['created_at', 'entity_type', 'entity_id']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
})

// Types exportados
export type TagLinkEntityType = z.infer<typeof tagLinkEntityTypeEnum>
export type TagLinksAttach = z.infer<typeof tagLinksAttachSchema>
export type TagLinksDetach = z.infer<typeof tagLinksDetachSchema>
export type TagLinkQuery = z.infer<typeof tagLinkQuerySchema>
export type TagLinksPayload = z.infer<typeof tagLinksAttachSchema>
