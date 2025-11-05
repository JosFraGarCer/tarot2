// server/api/world/[id].delete.ts
import { defineEventHandler, getQuery } from 'h3'
import { createResponse } from '../../utils/response'
import { getRequestedLanguage } from '../../utils/i18n'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const id = Number(event.context.params?.id)
    const lang = getRequestedLanguage(getQuery(event))

    if (lang === 'en') {
      await globalThis.db.transaction().execute(async (trx) => {
        await trx.deleteFrom('world_translations').where('world_id', '=', id).execute()
        await trx.deleteFrom('world').where('id', '=', id).execute()
      })
    } else {
      await globalThis.db
        .deleteFrom('world_translations')
        .where('world_id', '=', id)
        .where('language_code', '=', lang)
        .execute()
    }

    globalThis.logger?.info('World deleted', { id, lang, timeMs: Date.now() - startedAt })
    return createResponse({ ok: true }, null)
  } catch (error) {
    globalThis.logger?.error('Failed to delete world', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
