// server/api/tag/batch.patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { sql } from 'kysely'
import { z } from 'zod'
import { parseQuery } from '../../utils/parseQuery'
import { getRequestedLanguage } from '../../utils/i18n'
import { tagLangQuerySchema } from '../../schemas/tag'
import { createResponse } from '../../utils/response'
import { markLanguageFallback } from '../../utils/language'

const tagBatchSchema = z
  .object({
    ids: z.array(z.coerce.number().int()).min(1),
    is_active: z.coerce.boolean().optional(),
    category: z.string().optional(),
    parent_id: z.coerce.number().int().nullable().optional(),
    sort: z.coerce.number().int().optional(),
    name: z.string().min(1).optional(),
    short_text: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  })
  .refine((payload) => {
    const { ids: _ids, ...rest } = payload
    return Object.keys(rest).length > 0
  }, 'No fields to update')

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  const logger = event.context.logger ?? globalThis.logger
  const userId = (event.context.user as { id: number })?.id ?? null

  logger?.info?.({
    scope: 'tag.batch.start',
    requestId: event.context.requestId ?? null,
    time: new Date().toISOString(),
  }, 'Tag batch update started')

  const query = parseQuery(event, tagLangQuerySchema, { scope: 'tag.batch.query' })
  const lang = getRequestedLanguage(query)

  const body = tagBatchSchema.parse(await readBody(event))
  const ids = Array.from(new Set(body.ids))

  const basePatch: Record<string, unknown> = {}
  if (body.is_active !== undefined) basePatch.is_active = body.is_active
  if (body.category !== undefined) basePatch.category = body.category
  if (body.parent_id !== undefined) basePatch.parent_id = body.parent_id
  if (body.sort !== undefined) basePatch.sort = body.sort
  if (userId != null && Object.keys(basePatch).length) {
    basePatch.updated_by = userId
  }

  const translationPatch: Record<string, unknown> = {}
  if (body.name !== undefined) translationPatch.name = body.name
  if (body.short_text !== undefined) translationPatch.short_text = body.short_text
  if (body.description !== undefined) translationPatch.description = body.description

  await globalThis.db.transaction().execute(async (trx) => {
    if (Object.keys(basePatch).length) {
      await trx
        .updateTable('tags')
        .set(basePatch)
        .where('id', 'in', ids)
        .execute()
    } else {
      // Ensure entities exist when only translations provided
      const count = await trx.selectFrom('tags').select(sql`count(*)`.as('c')).where('id', 'in', ids).executeTakeFirst()
      const total = Number((count as { c?: unknown })?.c ?? 0)
      if (total !== ids.length) {
        throw createError({ statusCode: 404, statusMessage: 'One or more tags not found' })
      }
    }

    if (Object.keys(translationPatch).length) {
      for (const id of ids) {
        const existing = await trx
          .selectFrom('tags_translations')
          .select(['id'])
          .where('tag_id', '=', id)
          .where('language_code', '=', lang)
          .executeTakeFirst()

        if (existing) {
          await trx
            .updateTable('tags_translations')
            .set({
              ...(translationPatch.name !== undefined ? { name: translationPatch.name as string } : {}),
              ...(translationPatch.short_text !== undefined ? { short_text: (translationPatch.short_text as string) ?? null } : {}),
              ...(translationPatch.description !== undefined ? { description: (translationPatch.description as string) ?? null } : {}),
            })
            .where('id', '=', (existing as { id: unknown }).id)
            .execute()
        } else {
          if (translationPatch.name === undefined) {
            throw createError({ statusCode: 400, statusMessage: 'name is required to create new translations' })
          }
          await trx
            .insertInto('tags_translations')
            .values({
              tag_id: id,
              language_code: lang,
              name: translationPatch.name as string,
              short_text: (translationPatch.short_text as string) ?? null,
              description: (translationPatch.description as string) ?? null,
            })
            .execute()
        }
      }
    }
  })

  const rows = await globalThis.db
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
    .where('t.id', 'in', ids)
    .execute()

  const normalized = markLanguageFallback(rows, lang)

  logger?.info?.({
    scope: 'tag.batch.end',
    requestId: event.context.requestId ?? null,
    lang,
    ids,
    count: rows.length,
    timeMs: Date.now() - startedAt,
  }, 'Tag batch update completed')

  return createResponse(normalized, {
    lang,
    count: rows.length,
    updated_ids: ids,
  })
})
