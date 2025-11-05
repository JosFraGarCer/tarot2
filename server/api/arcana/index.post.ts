// server/api/arcana/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { createResponse } from '../../utils/response'
import { safeParseOrThrow } from '../../utils/validate'
import { createArcanaSchema } from '../../schemas/arcana'
import type { CardStatus } from '../../database/types'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const body = safeParseOrThrow(createArcanaSchema, await readBody(event))

    const inserted = await globalThis.db
      .insertInto('arcana')
      .values({
        code: body.code,
        image: body.image ?? null,
        ...(body.status !== undefined ? { status: body.status as CardStatus } : {}),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await globalThis.db
      .insertInto('arcana_translations')
      .values({
        arcana_id: inserted.id as number,
        language_code: 'en',
        name: body.name,
        short_text: body.short_text ?? null,
        description: body.description ?? null,
      })
      .execute()

    const row = await globalThis.db
      .selectFrom('arcana as a')
      .leftJoin('arcana_translations as t', (join) =>
        join.onRef('t.arcana_id', '=', 'a.id').on('t.language_code', '=', 'en'),
      )
      .select([
        'a.id',
        'a.code',
        'a.status',
        'a.created_at',
        'a.modified_at',
        't.name as name',
        't.short_text as short_text',
        't.description as description',
        't.language_code as language_code',
      ])
      .where('a.id', '=', inserted.id as number)
      .executeTakeFirstOrThrow()

    globalThis.logger?.info('Arcana created', { id: inserted.id, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to create arcana', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
