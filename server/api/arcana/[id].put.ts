// server/api/arcana/[id].put.ts
import { defineEventHandler, getQuery, readBody } from 'h3'
import { safeParseOrThrow } from '../../utils/validate'
import { createResponse } from '../../utils/response'
import { getRequestedLanguage } from '../../utils/i18n'
import { updateArcanaSchema } from '../../schemas/arcana'
import { notFound } from '../../utils/error'
import { sql } from 'kysely'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const id = Number(event.context.params?.id)
    const lang = getRequestedLanguage(getQuery(event))
    const body = safeParseOrThrow(updateArcanaSchema, await readBody(event))

    // Update base entity if base fields provided
    const baseUpdate: Record<string, unknown> = {}
    if (body.code !== undefined) baseUpdate.code = body.code
    if (body.image !== undefined) baseUpdate.image = body.image ?? null
    if (body.status !== undefined) baseUpdate.status = body.status

    if (Object.keys(baseUpdate).length) {
      const res = await globalThis.db
        .updateTable('arcana')
        .set(baseUpdate)
        .where('id', '=', id)
        .returning('id')
        .executeTakeFirst()
      if (!res) notFound('Arcana not found')
    }

    // Upsert translation for current language
    if (body.name !== undefined || body.short_text !== undefined || body.description !== undefined) {
      const exists = await globalThis.db
        .selectFrom('arcana_translations')
        .select('id')
        .where('arcana_id', '=', id)
        .where('language_code', '=', lang)
        .executeTakeFirst()

      if (exists) {
        await globalThis.db
          .updateTable('arcana_translations')
          .set({
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.short_text !== undefined ? { short_text: body.short_text ?? null } : {}),
            ...(body.description !== undefined ? { description: body.description ?? null } : {}),
          })
          .where('id', '=', exists.id as number)
          .execute()
      } else {
        await globalThis.db
          .insertInto('arcana_translations')
          .values({
            arcana_id: id,
            language_code: lang,
            name: body.name ?? '',
            short_text: body.short_text ?? null,
            description: body.description ?? null,
          })
          .execute()
      }
    }

    const row = await globalThis.db
      .selectFrom('arcana as a')
      .leftJoin('users as u', 'u.id', 'a.created_by')
      .leftJoin('arcana_translations as t_req', (join) =>
        join.onRef('t_req.arcana_id', '=', 'a.id').on('t_req.language_code', '=', lang),
      )
      .leftJoin('arcana_translations as t_en', (join) =>
        join.onRef('t_en.arcana_id', '=', 'a.id').on('t_en.language_code', '=', sql`'en'`),
      )
      .select([
        'a.id',
        'a.code',
        'a.status',
        'a.is_active',
        'a.created_by',
        'a.created_at',
        'a.modified_at',
        sql`coalesce(t_req.name, t_en.name)`.as('name'),
        sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
        sql`coalesce(t_req.description, t_en.description)`.as('description'),
        sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
        sql`u.username`.as('create_user'),
      ])
      .where('a.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('Arcana not found')

    globalThis.logger?.info('Arcana updated', { id, lang, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to update arcana', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
