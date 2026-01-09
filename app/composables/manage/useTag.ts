// app/composables/manage/useTag.ts
// /app/composables/manage/useTag.ts
import { useEntity } from '~/composables/manage/useEntity'
import type { EntityCrud } from '~/composables/manage/useEntity'
import { tagCreateSchema, tagUpdateSchema } from '../../../shared/schemas/entities/tag'
import type { Tag, TagCreate, TagUpdate } from '@/types/entities/entities'

export type TagCrud = EntityCrud<Tag, TagCreate, TagUpdate>

export function useTagCrud(): TagCrud {
  return useEntity<Tag, TagCreate, TagUpdate>({
    resourcePath: '/tag',
    schema: {
      create: tagCreateSchema,
      update: tagUpdateSchema,
    },
    filters: { search: '', is_active: true, parent_id: true },
    pagination: true,
  })
}
