// app/composables/manage/useBaseCard.ts
// /app/composables/manage/useBaseCard.ts
import { useEntity, type EntityFilterConfig } from '~/composables/manage/useEntity'
import type { ManageCrud } from '@/types/manage'
import { baseCardCreateSchema, baseCardUpdateSchema } from '../../../shared/schemas/entities/basecard'
import type { BaseCardList, BaseCardCreate, BaseCardUpdate } from '@/types/entities'

const baseCardFilterConfig: EntityFilterConfig = {
  search: 'search',
  status: 'status',
  is_active: 'is_active',
  type: 'card_type_id',
  tags: 'tag_ids',
}

const baseCardFilters = {
  search: '',
  status: true,
  is_active: true,
  card_type_id: true,
  tag_ids: true,
}

export function useBaseCardCrud(): ManageCrud<BaseCardList, BaseCardCreate, BaseCardUpdate> {
  return useEntity<BaseCardList, BaseCardCreate, BaseCardUpdate>({
    resourcePath: '/api/base_card',
    schema: {
      create: baseCardCreateSchema,
      update: baseCardUpdateSchema,
    },
    filters: baseCardFilters,
    filterConfig: baseCardFilterConfig,
    pagination: true,
  })
}
