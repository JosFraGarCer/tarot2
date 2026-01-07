// app/composables/manage/useFacet.ts
// /app/composables/manage/useFacet.ts
import { useEntity, type EntityFilterConfig } from '~/composables/manage/useEntity'
import type { ManageCrud } from '@/types/manage'
import { facetCreateSchema, facetUpdateSchema } from '../../../shared/schemas/entities/facet'
import type { FacetList, FacetCreate, FacetUpdate } from '@/types/entities'

export const facetFilterConfig: EntityFilterConfig = {
  search: 'search',
  status: 'status',
  is_active: 'is_active',
  facet: 'arcana_id',
  tags: 'tag_ids',
}

export const facetFilters = {
  search: '',
  status: true,
  is_active: true,
  arcana_id: true,
  tag_ids: true,
}

export function useFacetCrud(): ManageCrud<FacetList, FacetCreate, FacetUpdate> {
  return useEntity<FacetList, FacetCreate, FacetUpdate>({
    resourcePath: '/api/facet',
    schema: {
      create: facetCreateSchema,
      update: facetUpdateSchema,
    },
    filters: facetFilters,
    filterConfig: facetFilterConfig,
    pagination: true,
  })
}
