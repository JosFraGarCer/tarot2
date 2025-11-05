// server/api/base_card/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { createResponse } from '../../utils/response'
import { safeParseOrThrow } from '../../utils/validate'
import { createBaseCardSchema } from '../../schemas/base-card'
import type { CardStatus } from '../../database/types'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const body = safeParseOrThrow(createBaseCardSchema, await readBody(event))

    const inserted = await globalThis.db
      .insertInto('base_card')
      .values({
        code: body.code,
        card_type_id: body.card_type_id,
        image: body.image ?? null,
        ...(body.status !== undefined ? { status: body.status as CardStatus } : {}),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await globalThis.db
      .insertInto('base_card_translations')
      .values({
        card_id: inserted.id as number,
        language_code: 'en',
        name: body.name,
        short_text: body.short_text ?? null,
        description: body.description ?? null,
      })
      .execute()

    const row = await globalThis.db
      .selectFrom('base_card as c')
      .leftJoin('base_card_translations as t', (join) =>
        join.onRef('t.card_id', '=', 'c.id').on('t.language_code', '=', 'en'),
      )
      .select([
        'c.id',
        'c.code',
        'c.card_type_id',
        'c.status',
        'c.created_at',
        'c.modified_at',
        't.name as name',
        't.short_text as short_text',
        't.description as description',
        't.language_code as language_code',
      ])
      .where('c.id', '=', inserted.id as number)
      .executeTakeFirstOrThrow()

    globalThis.logger?.info('Base card created', { id: inserted.id, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to create base card', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
