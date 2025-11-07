// /app/composables/manage/useFacet.ts
import { useEntity } from '~/composables/manage/useEntity'
import { facetCreateSchema, facetUpdateSchema } from '~/schemas/entities/facet'
import type { FacetList, FacetCreate, FacetUpdate } from '@/types/entities'

export function useFacetCrud() {
  return useEntity<FacetList, FacetCreate, FacetUpdate>({
    resourcePath: '/api/facet',
    schema: {
      create: facetCreateSchema,
      update: facetUpdateSchema,
    },
    filters: { search: '', is_active: true, arcana_id: true, tag_ids: true },
    pagination: true,
  })
}
