// /app/composables/manage/useTag.ts
import { useEntity } from '~/composables/manage/useEntity'
import { tagCreateSchema, tagUpdateSchema } from '~/schemas/entities/tag'
import type { Tag, TagCreate, TagUpdate } from '@/types/entities/entities'

export function useTagCrud() {
  return useEntity<Tag, TagCreate, TagUpdate>({
    resourcePath: '/api/tag',
    schema: {
      create: tagCreateSchema,
      update: tagUpdateSchema,
    },
    filters: { search: '', isActive: true, category: true, parentId: true },
    pagination: true,
  })
}
