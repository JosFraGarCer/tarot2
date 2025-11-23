// server/api/tag/[id].delete.ts
import { defineEventHandler } from 'h3'
import { createResponse } from '../../utils/response'
import { parseQuery } from '../../utils/parseQuery'
import { getRequestedLanguage } from '../../utils/i18n'
import { tagLangQuerySchema } from '../../schemas/tag'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  const logger = event.context.logger ?? globalThis.logger
  try {
    const idParam = event.context.params?.id
    const id = Number(idParam)
    if (!Number.isFinite(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

    logger?.info?.({ scope: 'tag.delete.start', id, time: new Date().toISOString() })

    const query = parseQuery(event, tagLangQuerySchema, { scope: 'tag.delete.query' })
    const lang = getRequestedLanguage(query)

    const result = await globalThis.db.transaction().execute(async (trx) => {
      if (lang === 'en') {
        // Delete all translations then the tag itself
        await trx.deleteFrom('tags_translations').where('tag_id', '=', id).execute()
        const del = await trx.deleteFrom('tags').where('id', '=', id).returning('id').executeTakeFirst()
        return del?.id ? { ok: true } : null
      } else {
        const delT = await trx
          .deleteFrom('tags_translations')
          .where('tag_id', '=', id)
          .where('language_code', '=', lang)
          .returning('id')
          .executeTakeFirst()
        return delT?.id ? { ok: true } : null
      }
    })

    if (!result) throw createError({ statusCode: 404, statusMessage: 'Tag or translation not found' })

    logger?.info?.({ scope: 'tag.delete', id, lang, timeMs: Date.now() - startedAt }, 'Tag deleted')
    return createResponse({ ok: true }, { lang })
  } catch (error) {
    logger?.error?.(
      {
        scope: 'tag.delete',
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to delete tag',
    )
    throw error
  }
})
