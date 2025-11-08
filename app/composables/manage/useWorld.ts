// /app/composables/manage/useWorld.ts
import { useEntity } from '~/composables/manage/useEntity'
import type { ManageCrud } from '@/types/manage'
import { worldCreateSchema, worldUpdateSchema } from '~/schemas/entities/world'
import type { WorldList, WorldCreate, WorldUpdate } from '@/types/entities'

export function useWorldCrud(): ManageCrud<WorldList, WorldCreate, WorldUpdate> {
  return useEntity<WorldList, WorldCreate, WorldUpdate>({
    resourcePath: '/api/world',
    schema: {
      create: worldCreateSchema,
      update: worldUpdateSchema,
    },
    filters: { search: '', status: true, is_active: true, tag_ids: true },
    pagination: true,
  })
}
