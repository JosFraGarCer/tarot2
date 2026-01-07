import { defineEventHandler, readValidatedBody } from 'h3'
import { sql } from 'kysely'
import { createResponse } from '../../utils/response'
import { markLanguageFallback } from '../../utils/language'
import { getRequestedLanguage } from '../../utils/i18n'
import { parseQuery } from '../../utils/parseQuery'
import { tagCreateSchema, tagLangQuerySchema } from '../../schemas/tag'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  const logger = event.context.logger
  try {
    logger?.info({ scope: 'tag.create.start' }, 'Starting tag creation')
    const query = await parseQuery(event, tagLangQuerySchema, { scope: 'tag.create.query' })
    const lang = getRequestedLanguage(query)
    const body = await readValidatedBody(event, tagCreateSchema.parse)

    // Create tag and its initial EN translation in a transaction
    const created = await globalThis.db.transaction().execute(async (trx) => {
      const createdBy = body.created_by ?? null
      const tag = await trx
        .insertInto('tags')
        .values({
          code: body.code,
          category: body.category as any,
          parent_id: body.parent_id ?? null,
          sort: body.sort ?? 0,
          is_active: body.is_active ?? true,
          created_by: createdBy as any,
        })
        .returning(['id', 'code', 'category', 'parent_id', 'sort', 'is_active', 'created_by', 'created_at', 'modified_at'])
        .executeTakeFirstOrThrow()

      await trx
        .insertInto('tags_translations')
        .values({
          tag_id: tag.id as number,
          language_code: 'en',
          name: body.name,
          short_text: body.short_text ?? null,
          description: body.description ?? null,
        })
        .execute()

      // Return the created tag with its EN translation as resolved
      const row = await trx
        .selectFrom('tags as t')
        .leftJoin('tags_translations as t_en', (join) =>
          join.onRef('t_en.tag_id', '=', 't.id').on('t_en.language_code', '=', sql`'en'`),
        )
        .leftJoin('tags as tp', 'tp.id', 't.parent_id')
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
          sql`t_en.name`.as('name'),
          sql`t_en.short_text`.as('short_text'),
          sql`t_en.description`.as('description'),
          sql`'en'`.as('language_code_resolved'),
          sql`tp_en.name`.as('parent_name'),
        ])
        .where('t.id', '=', tag.id as number)
        .executeTakeFirst()

      return row!
    })

    logger?.info?.(
      {
        scope: 'tag.create',
        id: (created as { id: unknown }).id,
        code: (created as { code: unknown }).code,
        lang,
        timeMs: Date.now() - startedAt,
      },
      'Tag created',
    )
    return createResponse(markLanguageFallback(created, lang), { lang })
  } catch (error) {
    logger?.error?.(
      { scope: 'tag.create', error: error instanceof Error ? error.message : String(error) },
      'Failed to create tag',
    )
    throw error
  }
})
