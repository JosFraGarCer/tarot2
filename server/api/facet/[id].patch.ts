// server/api/facet/[id].patch.ts
// PATCH: update partial fields for Facet entity
import { defineEventHandler, getQuery, readBody } from 'h3'
import { safeParseOrThrow } from '../../utils/validate'
import { createResponse } from '../../utils/response'
import { getRequestedLanguage } from '../../utils/i18n'
import { updateFacetSchema } from '../../schemas/facet'
import { notFound } from '../../utils/error'
import type { CardStatus } from '../../database/types'
import { sql } from 'kysely'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const id = Number(event.context.params?.id)
    const lang = getRequestedLanguage(getQuery(event))
    const body = safeParseOrThrow(updateFacetSchema, await readBody(event))

    const baseUpdate: Record<string, unknown> = {}
    if (body.code !== undefined) baseUpdate.code = body.code
    if (body.arcana_id !== undefined) baseUpdate.arcana_id = body.arcana_id
    if (body.image !== undefined) baseUpdate.image = body.image ?? null
    if (body.status !== undefined) baseUpdate.status = body.status as CardStatus

    if (Object.keys(baseUpdate).length) {
      const res = await globalThis.db
        .updateTable('facet')
        .set(baseUpdate)
        .where('id', '=', id)
        .returning('id')
        .executeTakeFirst()
      if (!res) notFound('Facet not found')
    }

    if (body.name !== undefined || body.short_text !== undefined || body.description !== undefined) {
      const exists = await globalThis.db
        .selectFrom('facet_translations')
        .select('id')
        .where('facet_id', '=', id)
        .where('language_code', '=', lang)
        .executeTakeFirst()

      if (exists) {
        await globalThis.db
          .updateTable('facet_translations')
          .set({
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.short_text !== undefined ? { short_text: body.short_text ?? null } : {}),
            ...(body.description !== undefined ? { description: body.description ?? null } : {}),
          })
          .where('id', '=', exists.id as number)
          .execute()
      } else {
        await globalThis.db
          .insertInto('facet_translations')
          .values({
            facet_id: id,
            language_code: lang,
            name: body.name ?? '',
            short_text: body.short_text ?? null,
            description: body.description ?? null,
          })
          .execute()
      }
    }

    const row = await globalThis.db
      .selectFrom('facet as f')
      .leftJoin('users as u', 'u.id', 'f.created_by')
      .leftJoin('facet_translations as t_req', (join) =>
        join.onRef('t_req.facet_id', '=', 'f.id').on('t_req.language_code', '=', lang),
      )
      .leftJoin('facet_translations as t_en', (join) =>
        join.onRef('t_en.facet_id', '=', 'f.id').on('t_en.language_code', '=', sql`'en'`),
      )
      .leftJoin('arcana_translations as t_req_ar', (join) =>
        join.onRef('t_req_ar.arcana_id', '=', 'f.arcana_id').on('t_req_ar.language_code', '=', lang),
      )
      .leftJoin('arcana_translations as t_en_ar', (join) =>
        join.onRef('t_en_ar.arcana_id', '=', 'f.arcana_id').on('t_en_ar.language_code', '=', sql`'en'`),
      )
      .select([
        'f.id',
        'f.code',
        'f.arcana_id',
        'f.status',
        'f.is_active',
        'f.created_by',
        'f.created_at',
        'f.modified_at',
        sql`coalesce(t_req.name, t_en.name)`.as('name'),
        sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
        sql`coalesce(t_req.description, t_en.description)`.as('description'),
        sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
        sql`coalesce(t_req_ar.name, t_en_ar.name)`.as('arcana'),
        sql`u.username`.as('create_user'),
      ])
      .where('f.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('Facet not found')

    globalThis.logger?.info('Facet updated', { id, lang, timeMs: Date.now() - startedAt })
    return createResponse(row, null)
  } catch (error) {
    globalThis.logger?.error('Failed to update facet', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
