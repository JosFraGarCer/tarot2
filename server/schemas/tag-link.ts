// server/schemas/tag-link.ts
import { z } from 'zod'

const entityTypeEnum = z.enum([
  'arcana',
  'facet',
  'base_card',
  'base_card_type',
  'world',
  'world_card',
  'base_skills',
])

const idListSchema = z
  .union([
    z.coerce.number().int().min(1),
    z.array(z.coerce.number().int().min(1)).nonempty(),
  ])
  .transform((value) => (Array.isArray(value) ? value : [value]))
  .transform((values) => Array.from(new Set(values)))

export const tagLinksAttachSchema = z.object({
  entity_type: entityTypeEnum,
  entity_ids: idListSchema,
  tag_ids: idListSchema,
})

export const tagLinksDetachSchema = tagLinksAttachSchema

export type TagLinksPayload = z.infer<typeof tagLinksAttachSchema>
export type TagLinkEntityType = z.infer<typeof entityTypeEnum>
