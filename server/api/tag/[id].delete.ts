// server/api/tag/[id].delete.ts
import { defineEventHandler, getQuery } from 'h3'
import { createResponse } from '../../utils/response'
import { getRequestedLanguage } from '../../utils/i18n'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const idParam = event.context.params?.id
    const id = Number(idParam)
    if (!Number.isFinite(id)) throw createError({ statusCode: 400, statusMessage: 'Invalid id' })

    const q = getQuery(event)
    const lang = getRequestedLanguage(q)

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

    globalThis.logger?.info('Tag deleted', { id, lang, timeMs: Date.now() - startedAt })
    return createResponse({ ok: true }, null)
  } catch (error) {
    globalThis.logger?.error('Failed to delete tag', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
