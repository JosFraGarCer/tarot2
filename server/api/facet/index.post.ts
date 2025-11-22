// server/api/facet/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { createResponse } from '../../utils/response'
import { safeParseOrThrow } from '../../utils/validate'
import { createFacetSchema } from '../../schemas/facet'
import type { CardStatus } from '../../database/types'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const body = safeParseOrThrow(createFacetSchema, await readBody(event))

    const inserted = await globalThis.db
      .insertInto('facet')
      .values({
        code: body.code,
        arcana_id: body.arcana_id,
        image: body.image ?? null,
        legacy_effects: body.legacy_effects ?? false,
        effects: body.effects ?? null,
        ...(body.is_active !== undefined ? { is_active: body.is_active } : {}),
        ...(body.status !== undefined ? { status: body.status as CardStatus } : {}),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await globalThis.db
      .insertInto('facet_translations')
      .values({
        facet_id: inserted.id as number,
        language_code: 'en',
        name: body.name,
        short_text: body.short_text ?? null,
        description: body.description ?? null,
      })
      .execute()

    const row = await globalThis.db
      .selectFrom('facet as f')
      .leftJoin('facet_translations as t', (join) =>
        join.onRef('t.facet_id', '=', 'f.id').on('t.language_code', '=', 'en'),
      )
      .select([
        'f.id',
        'f.code',
        'f.arcana_id',
        'f.status',
        'f.legacy_effects',
        'f.effects',
        'f.created_at',
        'f.modified_at',
        't.name as name',
        't.short_text as short_text',
        't.description as description',
        't.language_code as language_code',
      ])
      .where('f.id', '=', inserted.id as number)
      .executeTakeFirstOrThrow()

    globalThis.logger?.info('Facet created', { id: inserted.id, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to create facet', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
