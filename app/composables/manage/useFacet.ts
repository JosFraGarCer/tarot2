// /app/composables/manage/useFacet.ts
import { useEntity } from '~/composables/manage/useEntity'
import type { ManageCrud } from '@/types/manage'
import { facetCreateSchema, facetUpdateSchema } from '~/schemas/entities/facet'
import type { FacetList, FacetCreate, FacetUpdate } from '@/types/entities'

export function useFacetCrud(): ManageCrud<FacetList, FacetCreate, FacetUpdate> {
  return useEntity<FacetList, FacetCreate, FacetUpdate>({
    resourcePath: '/api/facet',
    schema: {
      create: facetCreateSchema,
      update: facetUpdateSchema,
    },
    filters: { search: '', status: true, is_active: true, arcana_id: true, tag_ids: true },
    pagination: true,
  })
}
