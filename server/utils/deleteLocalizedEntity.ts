import type { H3Event } from 'h3'
import type { Kysely, Transaction } from 'kysely'
import { createError } from 'h3'
import type { DB } from '../database/types'

export interface DeleteLocalizedEntityOptions {
  event: H3Event
  db?: Kysely<DB>
  baseTable: keyof DB
  translationTable: keyof DB
  foreignKey: string
  idColumn?: string
  languageKey?: string
  id: number
  lang: string
  defaultLang?: string
  onDeleteBase?: (trx: Transaction<DB>, id: number) => Promise<void>
  onDeleteTranslation?: (trx: Transaction<DB>, id: number, lang: string) => Promise<void>
}

export async function deleteLocalizedEntity(options: DeleteLocalizedEntityOptions) {
  const db = options.db ?? globalThis.db
  if (!db) throw new Error('Database instance not available')

  const {
    event,
    baseTable,
    translationTable,
    foreignKey,
    id,
    lang,
  } = options

  const idColumn = options.idColumn ?? 'id'
  const languageKey = options.languageKey ?? 'language_code'
  const defaultLang = (options.defaultLang ?? 'en').toLowerCase()
  const requestedLang = (lang || defaultLang).toLowerCase()
  const logger = event.context.logger ?? (globalThis as any).logger
  const scope = `entity.delete.${String(baseTable)}`

  let deletedBase = false
  let deletedTranslation = false

  await db.transaction().execute(async (trx) => {
    if (requestedLang === defaultLang) {
      // Delete base entity and all translations
      const res = await trx
        .deleteFrom(baseTable)
        .where(idColumn, '=', id)
        .executeTakeFirst()

      if (!res) {
        throw createError({ statusCode: 404, statusMessage: 'Entity not found' })
      }

      deletedBase = true

      if (options.onDeleteBase) {
        await options.onDeleteBase(trx, id)
      } else {
        await trx.deleteFrom(translationTable).where(foreignKey, '=', id).execute()
      }

      deletedTranslation = true
    } else {
      // Delete only translation row
      const res = await trx
        .deleteFrom(translationTable)
        .where(foreignKey, '=', id)
        .where(languageKey, '=', requestedLang)
        .executeTakeFirst()

      if (!res) {
        throw createError({ statusCode: 404, statusMessage: 'Translation not found' })
      }

      deletedTranslation = true

      if (options.onDeleteTranslation) {
        await options.onDeleteTranslation(trx, id, requestedLang)
      }
    }
  })

  logger?.info?.(
    {
      scope,
      id,
      lang: requestedLang,
      deletedBase,
      deletedTranslation,
    },
    'Localized entity deletion completed',
  )

  return { deletedBase, deletedTranslation, lang: requestedLang }
}
