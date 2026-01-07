import { defineEventHandler, readValidatedBody, createError } from 'h3'
import { sql } from 'kysely'
import { createResponse } from '../../utils/response'
import { markLanguageFallback } from '../../utils/language'
import { getRequestedLanguage } from '../../utils/i18n'
import { parseQuery } from '../../utils/parseQuery'
import { tagUpdateSchema, tagLangQuerySchema } from '../../schemas/tag'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  const logger = event.context.logger
  try {
    const idParam = event.context.params?.id
    const id = Number(idParam)
    if (!Number.isFinite(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

    logger?.info({ scope: 'tag.update.start', id }, 'Starting tag update')

    const query = await parseQuery(event, tagLangQuerySchema, { scope: 'tag.update.query' })
    const lang = getRequestedLanguage(query)

    const body = await readValidatedBody(event, tagUpdateSchema.parse)

    const result = await globalThis.db.transaction().execute(async (trx) => {
      // Update base tag fields if provided
      const basePatch: Record<string, unknown> = {}
      if (body.code !== undefined) basePatch.code = body.code
      if (body.category !== undefined) basePatch.category = body.category
      if (body.parent_id !== undefined) basePatch.parent_id = body.parent_id
      if (body.sort !== undefined) basePatch.sort = body.sort
      if (body.is_active !== undefined) basePatch.is_active = body.is_active
      if (body.created_by !== undefined) basePatch.created_by = body.created_by

      if (Object.keys(basePatch).length > 0) {
        const upd = await trx.updateTable('tags').set(basePatch).where('id', '=', id).returning('id').executeTakeFirst()
        if (!upd) return null
      } else {
        // ensure exists
        const exists = await trx.selectFrom('tags').select('id').where('id', '=', id).executeTakeFirst()
        if (!exists) return null
      }

      // Upsert translation if any translation field was provided
      const hasTranslationFields =
        body.name !== undefined || body.short_text !== undefined || body.description !== undefined
      if (hasTranslationFields) {
        const existing = await trx
          .selectFrom('tags_translations')
          .select(['id'])
          .where('tag_id', '=', id)
          .where('language_code', '=', lang)
          .executeTakeFirst()

        if (existing) {
          const tpatch: Record<string, unknown> = {}
          if (body.name !== undefined) tpatch.name = body.name
          if (body.short_text !== undefined) tpatch.short_text = body.short_text
          if (body.description !== undefined) tpatch.description = body.description
          if (Object.keys(tpatch).length > 0) {
            await trx
              .updateTable('tags_translations')
              .set(tpatch)
              .where('id', '=', (existing as { id: unknown }).id)
              .execute()
          }
        } else {
          if (body.name === undefined) {
            throw createError({ statusCode: 400, statusMessage: 'name is required to create a new translation' })
          }
          await trx
            .insertInto('tags_translations')
            .values({
              tag_id: id,
              language_code: lang,
              name: body.name,
              short_text: body.short_text ?? null,
              description: body.description ?? null,
            })
            .execute()
        }
      }

      // Return coalesced row for requested language
      const row = await trx
        .selectFrom('tags as t')
        .leftJoin('tags_translations as t_req', (join) =>
          join.onRef('t_req.tag_id', '=', 't.id').on('t_req.language_code', '=', lang),
        )
        .leftJoin('tags_translations as t_en', (join) =>
          join.onRef('t_en.tag_id', '=', 't.id').on('t_en.language_code', '=', sql`'en'`),
        )
        .leftJoin('tags as tp', 'tp.id', 't.parent_id')
        .leftJoin('tags_translations as tp_req', (join) =>
          join.onRef('tp_req.tag_id', '=', 'tp.id').on('tp_req.language_code', '=', lang),
        )
        .leftJoin('tags_translations as tp_en', (join) =>
          join.onRef('tp_en.tag_id', '=', 'tp.id').on('tp_en.language_code', '=', sql`'en'`),
        )
        .select([
          't.id',
          't.code',
          't.category',
          't.parent_id',
          't.sort',
          't.is_active',
          't.created_by',
          't.created_at',
          't.modified_at',
          sql`coalesce(t_req.name, t_en.name)`.as('name'),
          sql`coalesce(t_req.short_text, t_en.short_text)`.as('short_text'),
          sql`coalesce(t_req.description, t_en.description)`.as('description'),
          sql`coalesce(t_req.language_code, 'en')`.as('language_code_resolved'),
          sql`coalesce(tp_req.name, tp_en.name)`.as('parent_name'),
        ])
        .where('t.id', '=', id)
        .executeTakeFirst()

      return row
    })

    if (!result) throw createError({ statusCode: 404, statusMessage: 'Tag not found' })

    logger?.info?.({ scope: 'tag.update', id, lang, timeMs: Date.now() - startedAt }, 'Tag updated')
    return createResponse(markLanguageFallback(result, lang), { lang })
  } catch (error) {
    logger?.error?.(
      {
        scope: 'tag.update',
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to update tag',
    )
    throw error
  }
})
