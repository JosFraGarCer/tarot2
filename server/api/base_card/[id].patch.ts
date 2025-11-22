// server/api/base_card/[id].patch.ts
// PATCH: update partial fields for Base Card entity
import { defineEventHandler, getQuery, readBody } from 'h3'
import { safeParseOrThrow } from '../../utils/validate'
import { createResponse } from '../../utils/response'
import { getRequestedLanguage } from '../../utils/i18n'
import { updateBaseCardSchema } from '../../schemas/base-card'
import { notFound } from '../../utils/error'
import { sql } from 'kysely'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const id = Number(event.context.params?.id)
    const lang = getRequestedLanguage(getQuery(event))
    const body = safeParseOrThrow(updateBaseCardSchema, await readBody(event))

    const baseUpdate: Record<string, unknown> = {}
    if (body.code !== undefined) baseUpdate.code = body.code
    if (body.card_type_id !== undefined) baseUpdate.card_type_id = body.card_type_id
    if (body.image !== undefined) baseUpdate.image = body.image ?? null
    if (body.status !== undefined) baseUpdate.status = body.status
    if (body.legacy_effects !== undefined) baseUpdate.legacy_effects = body.legacy_effects
    if (body.effects !== undefined) baseUpdate.effects = body.effects ?? null

    if (Object.keys(baseUpdate).length) {
      const res = await globalThis.db
        .updateTable('base_card')
        .set(baseUpdate)
        .where('id', '=', id)
        .returning('id')
        .executeTakeFirst()
      if (!res) notFound('Base card not found')
    }

    if (body.name !== undefined || body.short_text !== undefined || body.description !== undefined) {
      const exists = await globalThis.db
        .selectFrom('base_card_translations')
        .select('id')
        .where('card_id', '=', id)
        .where('language_code', '=', lang)
        .executeTakeFirst()

      if (exists) {
        await globalThis.db
          .updateTable('base_card_translations')
          .set({
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.short_text !== undefined ? { short_text: body.short_text ?? null } : {}),
            ...(body.description !== undefined ? { description: body.description ?? null } : {}),
          })
          .where('id', '=', exists.id as number)
          .execute()
      } else {
        await globalThis.db
          .insertInto('base_card_translations')
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
      .selectFrom('base_card as c')
      .leftJoin('users as u', 'u.id', 'c.created_by')
      .leftJoin('base_card_translations as t_req', (join) =>
        join.onRef('t_req.card_id', '=', 'c.id').on('t_req.language_code', '=', lang),
      )
      .leftJoin('base_card_translations as t_en', (join) =>
        join.onRef('t_en.card_id', '=', 'c.id').on('t_en.language_code', '=', sql`'en'`),
      )
      .leftJoin('base_card_type_translations as t_req_ct', (join) =>
        join.onRef('t_req_ct.card_type_id', '=', 'c.card_type_id').on('t_req_ct.language_code', '=', lang),
      )
      .leftJoin('base_card_type_translations as t_en_ct', (join) =>
        join.onRef('t_en_ct.card_type_id', '=', 'c.card_type_id').on('t_en_ct.language_code', '=', sql`'en'`),
      )
      .select([
        'c.id',
        'c.code',
        'c.card_type_id',
        'c.status',
        'c.is_active',
        'c.created_by',
        'c.image',
        'c.created_at',
        'c.modified_at',
        'c.legacy_effects',
        sql`coalesce(c.effects, '{}'::jsonb)`.as('effects'),
        sql`coalesce(t_req.name, t_en.name)`.as('name'),
        sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
        sql`coalesce(t_req.description, t_en.description)`.as('description'),
        sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
        sql`coalesce(t_req_ct.name, t_en_ct.name)`.as('card_type'),
        sql`u.username`.as('create_user'),
      ])
      .where('c.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('Base card not found')

    globalThis.logger?.info('Base card updated', { id, lang, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to update base card', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
