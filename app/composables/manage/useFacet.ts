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
    filters: { search: '', isActive: true, arcanaId: true, tagIds: true },
    pagination: true,
  })
}
