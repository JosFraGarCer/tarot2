// /app/composables/manage/useCardType.ts
import { useEntity } from '~/composables/manage/useEntity'
import type { ManageCrud } from '@/types/manage'
import { cardTypeCreateSchema, cardTypeUpdateSchema } from '~/schemas/entities/cardtype'
import type { CardTypeList, CardTypeCreate, CardTypeUpdate } from '@/types/entities'

export function useCardTypeCrud(): ManageCrud<CardTypeList, CardTypeCreate, CardTypeUpdate> {
  return useEntity<CardTypeList, CardTypeCreate, CardTypeUpdate>({
    resourcePath: '/api/card_type',
    schema: {
      create: cardTypeCreateSchema,
      update: cardTypeUpdateSchema,
    },
    filters: { search: '', is_active: true },
    pagination: true,
  })
}
