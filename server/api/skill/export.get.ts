// server/api/skill/export.get.ts
import { defineEventHandler } from 'h3'
import { exportEntities } from '../../utils/entityCrudHelpers'

export default defineEventHandler(async (event) =>
  exportEntities({ event, table: 'base_skills' }),
)
