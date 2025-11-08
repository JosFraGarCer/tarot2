// /app/composables/manage/useArcana.ts
import { useEntity } from '~/composables/manage/useEntity'
import type { ManageCrud } from '@/types/manage'
import { arcanaCreateSchema, arcanaUpdateSchema } from '~/schemas/entities/arcana'
import type { ArcanaList, ArcanaCreate, ArcanaUpdate } from '@/types/entities'

export function useArcanaCrud(): ManageCrud<ArcanaList, ArcanaCreate, ArcanaUpdate> {
  return useEntity<ArcanaList, ArcanaCreate, ArcanaUpdate>({
    resourcePath: '/api/arcana',
    schema: {
      create: arcanaCreateSchema,
      update: arcanaUpdateSchema,
    },
    filters: { search: '', status: true, is_active: true, tag_ids: true },
    pagination: true,
  })
}
