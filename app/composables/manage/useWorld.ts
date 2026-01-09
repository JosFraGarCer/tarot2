// app/composables/manage/useWorld.ts
// /app/composables/manage/useWorld.ts
import { useEntity, type EntityFilterConfig } from '~/composables/manage/useEntity'
import type { ManageCrud } from '@/types/manage'
import { worldCreateSchema, worldUpdateSchema } from '@shared/schemas/entities/world'
import type { WorldList, WorldCreate, WorldUpdate } from '@/types/entities'

const worldFilterConfig: EntityFilterConfig = {
  search: 'search',
  status: 'status',
  is_active: 'is_active',
  tags: 'tag_ids',
}

const worldFilters = {
  search: '',
  status: true,
  is_active: true,
  tag_ids: true,
}

export function useWorldCrud(): ManageCrud<WorldList, WorldCreate, WorldUpdate> {
  return useEntity<WorldList, WorldCreate, WorldUpdate>({
    resourcePath: '/api/world',
    schema: {
      create: worldCreateSchema,
      update: worldUpdateSchema,
    },
    filters: worldFilters,
    filterConfig: worldFilterConfig,
    pagination: true,
  })
}
