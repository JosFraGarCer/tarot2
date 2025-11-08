// /app/composables/manage/useSkill.ts
import { useEntity } from '~/composables/manage/useEntity'
import type { ManageCrud } from '@/types/manage'
import { skillCreateSchema, skillUpdateSchema } from '~/schemas/entities/skill'
import type { SkillList, SkillCreate, SkillUpdate } from '@/types/entities'

export function useSkillCrud(): ManageCrud<SkillList, SkillCreate, SkillUpdate> {
  return useEntity<SkillList, SkillCreate, SkillUpdate>({
    resourcePath: '/api/skill',
    schema: {
      create: skillCreateSchema,
      update: skillUpdateSchema,
    },
    filters: { search: '', status: true, is_active: true, facet_id: true, tag_ids: true },
    pagination: true,
  })
}
