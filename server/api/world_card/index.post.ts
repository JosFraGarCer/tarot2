// server/api/world_card/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { createResponse } from '../../utils/response'
import { safeParseOrThrow } from '../../utils/validate'
import { createWorldCardSchema } from '../../schemas/world-card'
import type { CardStatus } from '../../database/types'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const body = safeParseOrThrow(createWorldCardSchema, await readBody(event))

    const inserted = await globalThis.db
      .insertInto('world_card')
      .values({
        code: body.code,
        world_id: body.world_id,
        base_card_id: body.base_card_id ?? null,
        is_override: body.is_override ?? null,
        image: body.image ?? null,
        ...(body.status !== undefined ? { status: body.status as CardStatus } : {}),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await globalThis.db
      .insertInto('world_card_translations')
      .values({
        card_id: inserted.id as number,
        language_code: 'en',
        name: body.name,
        short_text: body.short_text ?? null,
        description: body.description ?? null,
      })
      .execute()

    const row = await globalThis.db
      .selectFrom('world_card as wc')
      .leftJoin('world_card_translations as t', (join) =>
        join.onRef('t.card_id', '=', 'wc.id').on('t.language_code', '=', 'en'),
      )
      .select([
        'wc.id',
        'wc.code',
        'wc.world_id',
        'wc.base_card_id',
        'wc.is_override',
        'wc.status',
        'wc.created_at',
        'wc.modified_at',
        't.name as name',
        't.short_text as short_text',
        't.description as description',
        't.language_code as language_code',
      ])
      .where('wc.id', '=', inserted.id as number)
      .executeTakeFirstOrThrow()

    globalThis.logger?.info('World card created', { id: inserted.id, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to create world card', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
