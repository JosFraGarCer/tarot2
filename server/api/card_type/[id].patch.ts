// server/api/base_card_type/[id].patch.ts
// PATCH: update partial fields for Base Card Type entity
import { defineEventHandler, getQuery, readBody } from 'h3'
import { safeParseOrThrow } from '../../utils/validate'
import { createResponse } from '../../utils/response'
import { getRequestedLanguage } from '../../utils/i18n'
import { updateBaseCardTypeSchema } from '../../schemas/base-card-type'
import { notFound } from '../../utils/error'
import type { CardStatus } from '../../database/types'
import { sql } from 'kysely'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const id = Number(event.context.params?.id)
    const lang = getRequestedLanguage(getQuery(event))
    const body = safeParseOrThrow(updateBaseCardTypeSchema, await readBody(event))

    const baseUpdate: Record<string, unknown> = {}
    if (body.code !== undefined) baseUpdate.code = body.code
    if (body.image !== undefined) baseUpdate.image = body.image ?? null
    if (body.status !== undefined) baseUpdate.status = body.status as CardStatus

    if (Object.keys(baseUpdate).length) {
      const res = await globalThis.db
        .updateTable('base_card_type')
        .set(baseUpdate)
        .where('id', '=', id)
        .returning('id')
        .executeTakeFirst()
      if (!res) notFound('Card type not found')
    }

    if (body.name !== undefined || body.short_text !== undefined || body.description !== undefined) {
      const exists = await globalThis.db
        .selectFrom('base_card_type_translations')
        .select('id')
        .where('card_type_id', '=', id)
        .where('language_code', '=', lang)
        .executeTakeFirst()

      if (exists) {
        await globalThis.db
          .updateTable('base_card_type_translations')
          .set({
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.short_text !== undefined ? { short_text: body.short_text ?? null } : {}),
            ...(body.description !== undefined ? { description: body.description ?? null } : {}),
          })
          .where('id', '=', exists.id as number)
          .execute()
      } else {
        await globalThis.db
          .insertInto('base_card_type_translations')
          .values({
            card_type_id: id,
            language_code: lang,
            name: body.name ?? '',
            short_text: body.short_text ?? null,
            description: body.description ?? null,
          })
          .execute()
      }
    }

    const row = await globalThis.db
      .selectFrom('base_card_type as ct')
      .leftJoin('users as u', 'u.id', 'ct.created_by')
      .leftJoin('base_card_type_translations as t_req', (join) =>
        join.onRef('t_req.card_type_id', '=', 'ct.id').on('t_req.language_code', '=', lang),
      )
      .leftJoin('base_card_type_translations as t_en', (join) =>
        join.onRef('t_en.card_type_id', '=', 'ct.id').on('t_en.language_code', '=', sql`'en'`),
      )
      .select([
        'ct.id',
        'ct.code',
        'ct.status',
        'ct.is_active',
        'ct.created_by',
        'ct.image',
        'ct.created_at',
        'ct.modified_at',
        sql`coalesce(t_req.name, t_en.name)`.as('name'),
        sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
        sql`coalesce(t_req.description, t_en.description)`.as('description'),
        sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
        sql`u.username`.as('create_user'),
      ])
      .where('ct.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('Card type not found')

    globalThis.logger?.info('Card type updated', { id, lang, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to update card type', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
