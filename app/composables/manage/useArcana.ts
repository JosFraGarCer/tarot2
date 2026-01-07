// app/composables/manage/useArcana.ts
// /app/composables/manage/useArcana.ts
import { useEntity, type EntityFilterConfig } from '~/composables/manage/useEntity'
import type { ManageCrud } from '@/types/manage'
import { arcanaCreateSchema, arcanaUpdateSchema } from '../../../shared/schemas/entities/arcana'
import type { ArcanaList, ArcanaCreate, ArcanaUpdate } from '@/types/entities'

export const arcanaFilterConfig: EntityFilterConfig = {
  search: 'search',
  status: 'status',
  is_active: 'is_active',
  tags: 'tag_ids',
}

export const arcanaFilters = {
  search: '',
  status: true,
  is_active: true,
  tag_ids: true,
}

export function useArcanaCrud(): ManageCrud<ArcanaList, ArcanaCreate, ArcanaUpdate> {
  return useEntity<ArcanaList, ArcanaCreate, ArcanaUpdate>({
    resourcePath: '/api/arcana',
    schema: {
      create: arcanaCreateSchema,
      update: arcanaUpdateSchema,
    },
    filters: arcanaFilters,
    filterConfig: arcanaFilterConfig,
    pagination: true,
  })
}
