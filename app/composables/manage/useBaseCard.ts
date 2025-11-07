// /app/composables/manage/useBaseCard.ts
import { useEntity } from '~/composables/manage/useEntity'
import { baseCardCreateSchema, baseCardUpdateSchema } from '~/schemas/entities/basecard'
import type { BaseCardList, BaseCardCreate, BaseCardUpdate } from '@/types/entities'

export function useBaseCardCrud() {
  return useEntity<BaseCardList, BaseCardCreate, BaseCardUpdate>({
    resourcePath: '/api/base_card',
    schema: {
      create: baseCardCreateSchema,
      update: baseCardUpdateSchema,
    },
    filters: { search: '', is_active: true, card_type_id: true, tag_ids: true },
    pagination: true,
  })
}
