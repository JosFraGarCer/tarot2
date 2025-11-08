// /app/composables/manage/useBaseCard.ts
import { useEntity } from '~/composables/manage/useEntity'
import type { ManageCrud } from '@/types/manage'
import { baseCardCreateSchema, baseCardUpdateSchema } from '~/schemas/entities/basecard'
import type { BaseCardList, BaseCardCreate, BaseCardUpdate } from '@/types/entities'

export function useBaseCardCrud(): ManageCrud<BaseCardList, BaseCardCreate, BaseCardUpdate> {
  return useEntity<BaseCardList, BaseCardCreate, BaseCardUpdate>({
    resourcePath: '/api/base_card',
    schema: {
      create: baseCardCreateSchema,
      update: baseCardUpdateSchema,
    },
    filters: { search: '', status: true, is_active: true, card_type_id: true, tag_ids: true },
    pagination: true,
  })
}
