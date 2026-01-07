// server/api/arcana/[id].patch.ts
import { defineEventHandler, readValidatedBody } from 'h3'
import { arcanaCrud } from './_crud'
import { arcanaUpdateSchema } from '../../../shared/schemas/entities/arcana'

export default defineEventHandler(async (event) => {
  await readValidatedBody(event, arcanaUpdateSchema.parse)
  return arcanaCrud.update(event)
})
