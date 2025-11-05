// server/api/world/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { createResponse } from '../../utils/response'
import { safeParseOrThrow } from '../../utils/validate'
import { createWorldSchema } from '../../schemas/world'
import type { CardStatus } from '../../database/types'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const body = safeParseOrThrow(createWorldSchema, await readBody(event))

    const inserted = await globalThis.db
      .insertInto('world')
      .values({
        code: body.code,
        image: body.image ?? null,
        ...(body.status !== undefined ? { status: body.status as CardStatus } : {}),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await globalThis.db
      .insertInto('world_translations')
      .values({
        world_id: inserted.id as number,
        language_code: 'en',
        name: body.name,
        short_text: body.short_text ?? null,
        description: body.description ?? null,
      })
      .execute()

    const row = await globalThis.db
      .selectFrom('world as w')
      .leftJoin('world_translations as t', (join) =>
        join.onRef('t.world_id', '=', 'w.id').on('t.language_code', '=', 'en'),
      )
      .select([
        'w.id',
        'w.code',
        'w.status',
        'w.created_at',
        'w.modified_at',
        't.name as name',
        't.short_text as short_text',
        't.description as description',
        't.language_code as language_code',
      ])
      .where('w.id', '=', inserted.id as number)
      .executeTakeFirstOrThrow()

    globalThis.logger?.info('World created', { id: inserted.id, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to create world', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
