// app/composables/manage/useCardType.ts
// /app/composables/manage/useCardType.ts
import { useEntity, type EntityFilterConfig } from '~/composables/manage/useEntity'
import type { ManageCrud } from '@/types/manage'
import { cardTypeCreateSchema, cardTypeUpdateSchema } from '@shared/schemas/entities/cardtype'
import type { CardTypeList, CardTypeCreate, CardTypeUpdate } from '@/types/entities'

export const cardTypeFilterConfig: EntityFilterConfig = {
  search: 'search',
  is_active: 'is_active',
}

export const cardTypeFilters = {
  search: '',
  is_active: true,
}

export function useCardTypeCrud(): ManageCrud<CardTypeList, CardTypeCreate, CardTypeUpdate> {
  return useEntity<CardTypeList, CardTypeCreate, CardTypeUpdate>({
    resourcePath: '/api/card_type',
    schema: {
      create: cardTypeCreateSchema,
      update: cardTypeUpdateSchema,
    },
    filters: cardTypeFilters,
    filterConfig: cardTypeFilterConfig,
    pagination: true,
  })
}
