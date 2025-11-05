// server/api/base_card_type/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { createResponse } from '../../utils/response'
import { safeParseOrThrow } from '../../utils/validate'
import { createBaseCardTypeSchema } from '../../schemas/base-card-type'
import type { CardStatus } from '../../database/types'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const body = safeParseOrThrow(createBaseCardTypeSchema, await readBody(event))

    const inserted = await globalThis.db
      .insertInto('base_card_type')
      .values({
        code: body.code,
        image: body.image ?? null,
        ...(body.status !== undefined ? { status: body.status as CardStatus } : {}),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await globalThis.db
      .insertInto('base_card_type_translations')
      .values({
        card_type_id: inserted.id as number,
        language_code: 'en',
        name: body.name,
        short_text: body.short_text ?? null,
        description: body.description ?? null,
      })
      .execute()

    const row = await globalThis.db
      .selectFrom('base_card_type as ct')
      .leftJoin('base_card_type_translations as t', (join) =>
        join.onRef('t.card_type_id', '=', 'ct.id').on('t.language_code', '=', 'en'),
      )
      .select([
        'ct.id',
        'ct.code',
        'ct.status',
        'ct.created_at',
        'ct.modified_at',
        't.name as name',
        't.short_text as short_text',
        't.description as description',
        't.language_code as language_code',
      ])
      .where('ct.id', '=', inserted.id as number)
      .executeTakeFirstOrThrow()

    globalThis.logger?.info('Card type created', { id: inserted.id, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to create card type', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
