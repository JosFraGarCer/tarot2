// /app/composables/manage/useWorld.ts
import { useEntity } from '~/composables/manage/useEntity'
import { worldCreateSchema, worldUpdateSchema } from '~/schemas/entities/world'
import type { WorldList, WorldCreate, WorldUpdate } from '@/types/entities'

export function useWorldCrud() {
  return useEntity<WorldList, WorldCreate, WorldUpdate>({
    resourcePath: '/api/world',
    schema: {
      create: worldCreateSchema,
      update: worldUpdateSchema,
    },
    filters: { search: '', isActive: true, tagIds: true },
    pagination: true,
  })
}
