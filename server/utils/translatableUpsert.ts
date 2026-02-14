// server/utils/translatableUpsert.ts
import type { H3Event } from 'h3'
import type { Kysely, Transaction } from 'kysely'
import { sql } from 'kysely'
import type { DB } from '../database/types'
import { markLanguageFallback } from './language'

type DbExecutor = Kysely<DB> | Transaction<DB>
type UpsertPayload = Record<string, unknown>

interface UpsertLogger {
  info?: (obj: Record<string, unknown>, msg?: string) => void
}

function getGlobalLogger(): UpsertLogger | undefined {
  return (globalThis as { logger?: UpsertLogger }).logger
}

export interface TranslatableUpsertOptions<TEntityRow = unknown> {
  event: H3Event
  db?: Kysely<DB>
  executor?: DbExecutor
  id?: number | null
  lang?: string | null
  defaultLang?: string
  baseTable: keyof DB
  translationTable: keyof DB
  foreignKey: string
  languageKey?: string
  idColumn?: string
  baseData?: UpsertPayload
  translationData?: UpsertPayload | null
  select: (db: DbExecutor, id: number, lang: string) => Promise<TEntityRow>
  loggerScope?: string
}

export interface TranslatableUpsertResult<TEntityRow = unknown> {
  id: number
  lang: string
  wasCreated: boolean
  translationInserted: boolean
  translationUpdated: boolean
  row: TEntityRow
}

function pruneUndefined<T extends UpsertPayload>(source: T | undefined | null): UpsertPayload {
  if (!source) return {}
  const out: UpsertPayload = {}
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) out[key] = value
  }
  return out
}

async function upsertTranslation(
  trx: DbExecutor,
  options: Required<Pick<TranslatableUpsertOptions, 'translationTable' | 'foreignKey'>> & {
    languageKey: string
    entityId: number
    lang: string
    payload: Record<string, unknown>
  },
): Promise<'updated' | 'inserted' | 'skipped'> {
  const { translationTable, foreignKey, languageKey, entityId, lang, payload } = options
  const cleaned = pruneUndefined(payload)
  if (!Object.entries(cleaned).length) return 'skipped'

  // Use ON CONFLICT for atomic upsert in PostgreSQL
  const result = await trx
    .insertInto(translationTable)
    .values({
      [foreignKey]: entityId,
      [languageKey]: lang,
      ...cleaned,
    } as never)
    .onConflict((oc) =>
      oc.columns([foreignKey as never, languageKey as never]).doUpdateSet(cleaned as never)
    )
    .returning('id')
    .executeTakeFirst()

  return result ? 'updated' : 'inserted'
}

export async function translatableUpsert<TEntityRow = unknown>(
  opts: TranslatableUpsertOptions<TEntityRow>,
): Promise<TranslatableUpsertResult<TEntityRow>> {
  const fallbackDb = opts.db ?? globalThis.db
  if (!fallbackDb) throw new Error('Database instance not available')
  const readExecutor = opts.executor ?? fallbackDb

  const lang = (opts.lang ?? 'en').toLowerCase()
  const defaultLang = (opts.defaultLang ?? 'en').toLowerCase()
  const idColumn = opts.idColumn ?? 'id'
  const languageKey = opts.languageKey ?? 'language_code'
  const baseData = pruneUndefined(opts.baseData)
  const translationData = pruneUndefined(opts.translationData)
  const logger = (opts.event.context.logger as UpsertLogger | undefined) ?? getGlobalLogger()
  const scope = opts.loggerScope ?? 'translatable.upsert'

  let entityId = opts.id ?? null
  let wasCreated = false
  let translationInserted = false
  let translationUpdated = false

  const run = async (trx: DbExecutor) => {
    // Create or update base entity
    if (entityId == null) {
      if (!Object.keys(baseData).length) {
        throw new Error(`Cannot create ${String(opts.baseTable)} without base data`)
      }
      const inserted = await trx
        .insertInto(opts.baseTable)
        .values(baseData as never)
        .returning(idColumn as never)
        .executeTakeFirst()
      if (!inserted) throw new Error(`Failed to insert ${String(opts.baseTable)}`)
      entityId = Number((inserted as UpsertPayload)[idColumn])
      wasCreated = true
    } else if (Object.keys(baseData).length) {
      await trx
        .updateTable(opts.baseTable)
        .set(baseData as never)
        .where(idColumn as never, '=', entityId)
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
  }

  if (opts.executor) {
    await run(opts.executor)
  } else {
    await fallbackDb.transaction().execute(async (trx) => {
      await run(trx)
    })
  }

  if (entityId == null) throw new Error('Entity id not resolved after upsert')

  const row = await opts.select(readExecutor, entityId, lang)
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
