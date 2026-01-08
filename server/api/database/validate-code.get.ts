// server/api/database/validate-code.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { z } from 'zod'
import type { DB } from '../../database/types'

const querySchema = z.object({
  entity: z.enum(['arcana', 'skill', 'facet', 'base_card', 'world', 'card_type', 'tag']),
  code: z.string().min(1),
  excludeId: z.string().optional().transform(v => v ? Number(v) : undefined)
})

export default defineEventHandler(async (event) => {
  const result = querySchema.safeParse(getQuery(event))
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid query parameters',
      data: result.error.format()
    })
  }

  const { entity, code, excludeId } = result.data
  const db = (globalThis as any).db

  // Mapeo de entidades a sus tablas base
  const tableMap: Record<string, keyof DB> = {
    arcana: 'arcana',
    skill: 'base_skills',
    facet: 'facet',
    base_card: 'base_card',
    world: 'world',
    card_type: 'base_card_type',
    tag: 'tags'
  }

  const table = tableMap[entity]
  
  let query = db
    .selectFrom(table)
    .select(['id'])
    .where('code', '=', code)

  if (excludeId) {
    query = query.where('id', '!=', excludeId)
  }

  const existing = await query.executeTakeFirst()

  return {
    available: !existing,
    existingId: existing?.id || null
  }
})
