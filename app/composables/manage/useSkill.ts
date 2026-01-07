// app/composables/manage/useSkill.ts
// /app/composables/manage/useSkill.ts
import { useEntity, type EntityFilterConfig } from '~/composables/manage/useEntity'
import type { ManageCrud } from '@/types/manage'
import { skillCreateSchema, skillUpdateSchema } from '../../../shared/schemas/entities/skill'
import type { SkillList, SkillCreate, SkillUpdate } from '@/types/entities'

export const skillFilterConfig: EntityFilterConfig = {
  search: 'search',
  status: 'status',
  is_active: 'is_active',
  facet: 'facet_id',
  tags: 'tag_ids',
}

export const skillFilters = {
  search: '',
  status: true,
  is_active: true,
  facet_id: true,
  tag_ids: true,
}

export function useSkillCrud(): ManageCrud<SkillList, SkillCreate, SkillUpdate> {
  return useEntity<SkillList, SkillCreate, SkillUpdate>({
    resourcePath: '/api/skill',
    schema: {
      create: skillCreateSchema,
      update: skillUpdateSchema,
    },
    filters: skillFilters,
    filterConfig: skillFilterConfig,
    pagination: true,
  })
}
