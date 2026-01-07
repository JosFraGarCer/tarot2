// server/api/arcana/index.post.ts
import { defineEventHandler, readValidatedBody } from 'h3'
import { arcanaCrud } from './_crud'
import { arcanaCreateSchema } from '../../../shared/schemas/entities/arcana'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, arcanaCreateSchema.parse)
  return arcanaCrud.create(event)
})
