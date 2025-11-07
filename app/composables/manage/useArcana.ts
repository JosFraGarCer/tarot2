// /app/composables/manage/useArcana.ts
import { useEntity } from '~/composables/manage/useEntity'
import { arcanaCreateSchema, arcanaUpdateSchema } from '~/schemas/entities/arcana'
import type { ArcanaList, ArcanaCreate, ArcanaUpdate } from '@/types/entities'

export function useArcanaCrud() {
  return useEntity<ArcanaList, ArcanaCreate, ArcanaUpdate>({
    resourcePath: '/api/arcana',
    schema: {
      create: arcanaCreateSchema,
      update: arcanaUpdateSchema,
    },
    filters: { search: '', is_active: true, tag_ids: true },
    pagination: true,
  })
}
