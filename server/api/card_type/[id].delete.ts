// server/api/base_card_type/[id].delete.ts
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
        await trx
          .deleteFrom('base_card_type_translations')
          .where('card_type_id', '=', id)
          .execute()
        await trx.deleteFrom('base_card_type').where('id', '=', id).execute()
      })
    } else {
      await globalThis.db
        .deleteFrom('base_card_type_translations')
        .where('card_type_id', '=', id)
        .where('language_code', '=', lang)
        .execute()
    }

    globalThis.logger?.info('Card type deleted', { id, lang, timeMs: Date.now() - startedAt })
    return createResponse({ ok: true }, null)
  } catch (error) {
    globalThis.logger?.error('Failed to delete card type', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
