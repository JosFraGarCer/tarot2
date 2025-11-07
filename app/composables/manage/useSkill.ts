// /app/composables/manage/useSkill.ts
import { useEntity } from '~/composables/manage/useEntity'
import { skillCreateSchema, skillUpdateSchema } from '~/schemas/entities/skill'
import type { SkillList, SkillCreate, SkillUpdate } from '@/types/entities'

export function useSkillCrud() {
  return useEntity<SkillList, SkillCreate, SkillUpdate>({
    resourcePath: '/api/skill',
    schema: {
      create: skillCreateSchema,
      update: skillUpdateSchema,
    },
    filters: { search: '', isActive: true, facetId: true, tagIds: true },
    pagination: true,
  })
}
