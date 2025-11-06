import { defineEventHandler } from 'h3'
import { exportEntities } from '../../utils/entityCrudHelpers'

export default defineEventHandler(async (event) =>
  exportEntities({ event, table: 'world_card', translationForeignKey: 'card_id' }),
)
