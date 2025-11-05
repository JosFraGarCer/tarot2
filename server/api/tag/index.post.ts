// server/api/tag/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { sql } from 'kysely'
import { safeParseOrThrow } from '../../utils/validate'
import { createResponse } from '../../utils/response'
import { tagCreateSchema } from '../../schemas/tag'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const raw = await readBody(event)
    const body = safeParseOrThrow(tagCreateSchema, raw)

    // Create tag and its initial EN translation in a transaction
    const created = await globalThis.db.transaction().execute(async (trx) => {
      const tag = await trx
        .insertInto('tags')
        .values({
          code: body.code,
          category: body.category ?? (null as any),
          parent_id: body.parent_id ?? null,
          sort: body.sort ?? 0,
          is_active: body.is_active ?? true,
          created_by: body.created_by ?? null,
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

    globalThis.logger?.info('Tag created', { id: (created as any).id, code: (created as any).code, timeMs: Date.now() - startedAt })
    return createResponse(created, null)
  } catch (error) {
    globalThis.logger?.error('Failed to create tag', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
