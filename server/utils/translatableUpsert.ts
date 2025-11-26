// server/utils/translatableUpsert.ts
import type { H3Event } from 'h3'
import type { Kysely, Transaction } from 'kysely'
import { sql } from 'kysely'
import type { DB } from '../database/types'
import { markLanguageFallback } from './language'

export interface TranslatableUpsertOptions<TEntityRow = any> {
  event: H3Event
  db?: Kysely<DB>
  id?: number | null
  lang?: string | null
  defaultLang?: string
  baseTable: keyof DB
  translationTable: keyof DB
  foreignKey: string
  languageKey?: string
  idColumn?: string
  baseData?: Record<string, any>
  translationData?: Record<string, any> | null
  select: (db: Kysely<DB>, id: number, lang: string) => Promise<TEntityRow>
  loggerScope?: string
}

export interface TranslatableUpsertResult<TEntityRow = any> {
  id: number
  lang: string
  wasCreated: boolean
  translationInserted: boolean
  translationUpdated: boolean
  row: TEntityRow
}

function pruneUndefined<T extends Record<string, any>>(source: T | undefined | null): Record<string, any> {
  if (!source) return {}
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) out[key] = value
  }
  return out
}

async function upsertTranslation(
  trx: Transaction<DB>,
  options: Required<Pick<TranslatableUpsertOptions, 'translationTable' | 'foreignKey'>> & {
    languageKey: string
    entityId: number
    lang: string
    payload: Record<string, any>
  },
): Promise<'updated' | 'inserted' | 'skipped'> {
  const { translationTable, foreignKey, languageKey, entityId, lang, payload } = options
  const cleaned = pruneUndefined(payload)
  if (!Object.keys(cleaned).length) return 'skipped'

  const existing = await trx
    .selectFrom(translationTable)
    .select(['id'])
    .where(sql`${sql.ref(foreignKey)}`, '=', entityId)
    .where(sql`${sql.ref(languageKey)}`, '=', lang)
    .executeTakeFirst()

  if (existing) {
    await trx
      .updateTable(translationTable)
      .set(cleaned)
      .where('id', '=', (existing as any).id as number)
      .execute()
    return 'updated'
  }

  await trx
    .insertInto(translationTable)
    .values({
      [foreignKey]: entityId,
      [languageKey]: lang,
      ...cleaned,
    })
    .execute()

  return 'inserted'
}

export async function translatableUpsert<TEntityRow = any>(
  opts: TranslatableUpsertOptions<TEntityRow>,
): Promise<TranslatableUpsertResult<TEntityRow>> {
  const db = opts.db ?? globalThis.db
  if (!db) throw new Error('Database instance not available')

  const lang = (opts.lang ?? 'en').toLowerCase()
  const defaultLang = (opts.defaultLang ?? 'en').toLowerCase()
  const idColumn = opts.idColumn ?? 'id'
  const languageKey = opts.languageKey ?? 'language_code'
  const baseData = pruneUndefined(opts.baseData)
  const translationData = pruneUndefined(opts.translationData)
  const logger = opts.event.context.logger ?? (globalThis as any).logger
  const scope = opts.loggerScope ?? 'translatable.upsert'

  let entityId = opts.id ?? null
  let wasCreated = false
  let translationInserted = false
  let translationUpdated = false

  await db.transaction().execute(async (trx) => {
    // Create or update base entity
    if (entityId == null) {
      if (!Object.keys(baseData).length) {
        throw new Error(`Cannot create ${String(opts.baseTable)} without base data`)
      }
      const inserted = await trx
        .insertInto(opts.baseTable)
        .values(baseData)
        .returning(idColumn)
        .executeTakeFirst()
      if (!inserted) throw new Error(`Failed to insert ${String(opts.baseTable)}`)
      entityId = Number((inserted as any)[idColumn])
      wasCreated = true
    } else if (Object.keys(baseData).length) {
      await trx
        .updateTable(opts.baseTable)
        .set(baseData)
        .where(idColumn, '=', entityId)
        .execute()
    }

    // Translation upsert (requested lang)
    if (entityId == null) throw new Error('Entity id not resolved')
    if (Object.keys(translationData).length) {
      const result = await upsertTranslation(trx, {
        translationTable: opts.translationTable,
        foreignKey: opts.foreignKey,
        languageKey,
        entityId,
        lang,
        payload: translationData,
      })
      translationInserted = translationInserted || result === 'inserted'
      translationUpdated = translationUpdated || result === 'updated'
    }

    // Ensure default language translation exists on create
    if (wasCreated && lang !== defaultLang && Object.keys(translationData).length) {
      const hasDefault = await trx
        .selectFrom(opts.translationTable)
        .select(sql`1`.as('one'))
        .where(sql`${sql.ref(opts.foreignKey)}`, '=', entityId)
        .where(sql`${sql.ref(languageKey)}`, '=', defaultLang)
        .executeTakeFirst()

      if (!hasDefault) {
        await trx
          .insertInto(opts.translationTable)
          .values({
            [opts.foreignKey]: entityId,
            [languageKey]: defaultLang,
            ...translationData,
          })
          .execute()
        translationInserted = true
      }
    }
  })

  if (entityId == null) throw new Error('Entity id not resolved after upsert')

  const row = await opts.select(db, entityId, lang)
  const normalized = Array.isArray(row)
    ? row
    : markLanguageFallback(row, lang)

  logger?.info?.(
    {
      scope,
      id: entityId,
      lang,
      created: wasCreated,
      translationInserted,
      translationUpdated,
    },
    'Translatable entity upserted',
  )

  return {
    id: entityId,
    lang,
    wasCreated,
    translationInserted,
    translationUpdated,
    row: normalized,
  }
}
