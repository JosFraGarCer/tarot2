// server/api/world_card/[id].patch.ts
// PATCH: update partial fields for World Card entity
import { defineEventHandler, getQuery, readBody } from 'h3'
import { safeParseOrThrow } from '../../utils/validate'
import { createResponse } from '../../utils/response'
import { getRequestedLanguage } from '../../utils/i18n'
import { updateWorldCardSchema } from '../../schemas/world-card'
import { notFound } from '../../utils/error'
import type { CardStatus } from '../../database/types'
import { sql } from 'kysely'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const id = Number(event.context.params?.id)
    const lang = getRequestedLanguage(getQuery(event))
    const body = safeParseOrThrow(updateWorldCardSchema, await readBody(event))

    const baseUpdate: Record<string, unknown> = {}
    if (body.code !== undefined) baseUpdate.code = body.code
    if (body.world_id !== undefined) baseUpdate.world_id = body.world_id
    if (body.base_card_id !== undefined) baseUpdate.base_card_id = body.base_card_id ?? null
    if (body.is_override !== undefined) baseUpdate.is_override = body.is_override ?? null
    if (body.image !== undefined) baseUpdate.image = body.image ?? null
    if (body.status !== undefined) baseUpdate.status = body.status as CardStatus

    if (Object.keys(baseUpdate).length) {
      const res = await globalThis.db
        .updateTable('world_card')
        .set(baseUpdate)
        .where('id', '=', id)
        .returning('id')
        .executeTakeFirst()
      if (!res) notFound('World card not found')
    }

    if (body.name !== undefined || body.short_text !== undefined || body.description !== undefined) {
      const exists = await globalThis.db
        .selectFrom('world_card_translations')
        .select('id')
        .where('card_id', '=', id)
        .where('language_code', '=', lang)
        .executeTakeFirst()

      if (exists) {
        await globalThis.db
          .updateTable('world_card_translations')
          .set({
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.short_text !== undefined ? { short_text: body.short_text ?? null } : {}),
            ...(body.description !== undefined ? { description: body.description ?? null } : {}),
          })
          .where('id', '=', exists.id as number)
          .execute()
      } else {
        await globalThis.db
          .insertInto('world_card_translations')
          .values({
            card_id: id,
            language_code: lang,
            name: body.name ?? '',
            short_text: body.short_text ?? null,
            description: body.description ?? null,
          })
          .execute()
      }
    }

    const row = await globalThis.db
      .selectFrom('world_card as wc')
      .leftJoin('users as u', 'u.id', 'wc.created_by')
      .leftJoin('world_card_translations as t_req', (join) =>
        join.onRef('t_req.card_id', '=', 'wc.id').on('t_req.language_code', '=', lang),
      )
      .leftJoin('world_card_translations as t_en', (join) =>
        join.onRef('t_en.card_id', '=', 'wc.id').on('t_en.language_code', '=', sql`'en'`),
      )
      .select([
        'wc.id',
        'wc.code',
        'wc.world_id',
        'wc.base_card_id',
        'wc.is_override',
        'wc.status',
        'wc.is_active',
        'wc.created_by',
        'wc.image',
        'wc.created_at',
        'wc.modified_at',
        sql`coalesce(t_req.name, t_en.name)`.as('name'),
        sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
        sql`coalesce(t_req.description, t_en.description)`.as('description'),
        sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
        sql`u.username`.as('create_user'),
      ])
      .where('wc.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('World card not found')

    globalThis.logger?.info('World card updated', { id, lang, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to update world card', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
