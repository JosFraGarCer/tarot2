// server/utils/createCrudHandlers.ts
import { defineEventHandler, readBody, createError, getRequestHeader } from 'h3'
import type { H3Event } from 'h3'
import type { ZodSchema, ZodTypeAny } from 'zod'
import { z } from 'zod'
import type { Kysely, SelectQueryBuilder } from 'kysely'
import type { DB } from '../database/types'
import { parseQuery } from './parseQuery'
import { buildFilters, type BuildFiltersOptions } from './filters'
import { createPaginatedResponse, createResponse } from './response'
import { markLanguageFallback } from './language'
import { translatableUpsert } from './translatableUpsert'
import { deleteLocalizedEntity } from './deleteLocalizedEntity'
import { getRequestedLanguage } from './i18n'

interface CrudContext<TQuery> {
  event: H3Event
  db: Kysely<DB>
  query: TQuery
  lang: string
}

interface ListBuilder<TQuery, TRow> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseQuery: SelectQueryBuilder<any, any, any>
  filters?: Partial<BuildFiltersOptions>
  transformRows?: (rows: TRow[], ctx: CrudContext<TQuery>) => Promise<TRow[]> | TRow[]
  logMeta?: (params: {
    rows: TRow[]
    ctx: CrudContext<TQuery>
    page: number
    pageSize: number
    totalItems: number
  }) => Record<string, unknown>
  skipFallbackMark?: boolean
}

interface MutationsPayload<TCreate, TUpdate> {
  buildCreatePayload: (input: TCreate, ctx: CrudContext<TCreate>) => {
    baseData?: Record<string, unknown>
    translationData?: Record<string, unknown> | null
    lang?: string | null
  }
  buildUpdatePayload: (input: TUpdate, ctx: CrudContext<TUpdate>) => {
    baseData?: Record<string, unknown>
    translationData?: Record<string, unknown> | null
    lang?: string | null
    modifiedAt?: string | null
  }
}

interface TranslationConfig {
  table: keyof DB
  foreignKey: string
  languageKey?: string
  defaultLang?: string
}

interface CrudHandlersConfig<
  TQuerySchema extends ZodTypeAny,
  TCreateSchema extends ZodTypeAny,
  TUpdateSchema extends ZodTypeAny,
  TQuery = unknown,
  TCreate = unknown,
  TUpdate = unknown,
  TRow = Record<string, unknown>,
> {
  entity: string
  baseTable: keyof DB
  idColumn?: string
  schema: {
    query: TQuerySchema
    create: TCreateSchema
    update: TUpdateSchema
  }
  translation?: TranslationConfig | false
  buildListQuery: (
    ctx: CrudContext<TQuery>,
  ) => Promise<ListBuilder<TQuery, TRow>> | ListBuilder<TQuery, TRow>
  selectOne: (
    ctx: CrudContext<TQuery>,
    id: number,
  ) => Promise<TRow | undefined>
  mutations: MutationsPayload<TCreate, TUpdate>
  logScope?: string
  deleteQuerySchema?: ZodSchema<unknown>
}

interface CrudHandlers {
  list: ReturnType<typeof defineEventHandler>
  create: ReturnType<typeof defineEventHandler>
  detail: ReturnType<typeof defineEventHandler>
  update: ReturnType<typeof defineEventHandler>
  remove: ReturnType<typeof defineEventHandler>
}

const defaultLangQuerySchema = () =>
  z.object({
    lang: z.string().optional(),
  })

export function createCrudHandlers<
  TQuerySchema extends ZodTypeAny,
  TCreateSchema extends ZodTypeAny,
  TUpdateSchema extends ZodTypeAny,
  TRow = Record<string, unknown>,
  TQuery = z.infer<TQuerySchema>,
  TCreate = z.infer<TCreateSchema>,
  TUpdate = z.infer<TUpdateSchema>,
>(config: CrudHandlersConfig<TQuerySchema, TCreateSchema, TUpdateSchema, TQuery, TCreate, TUpdate, TRow>): CrudHandlers {
  const getDb = (event?: H3Event) => {
    return event?.context.db || (globalThis as any).db as Kysely<DB>
  }

  const translation = config.translation === undefined ? {
    table: `${String(config.baseTable)}_translations` as keyof DB,
    foreignKey: `${String(config.baseTable).replace(/s$/, '')}_id`,
    languageKey: 'language_code',
    defaultLang: 'en',
  } : config.translation

  const idColumn = config.idColumn ?? 'id'
  const deleteSchema = config.deleteQuerySchema ?? defaultLangQuerySchema()

  function resolveLangFromQuery(query: Record<string, unknown>): string {
    return getRequestedLanguage(query)
  }

  const list = defineEventHandler(async (event) => {
    const startedAt = Date.now()
    const logger = event.context.logger ?? (globalThis as unknown as { logger: { info: (data: unknown, msg: string) => void } }).logger
    const query = parseQuery(event, config.schema.query, { scope: `${config.logScope ?? config.entity}.list.query` }) as TQuery
    const lang = resolveLangFromQuery(query as Record<string, unknown>)
    const db = getDb(event)
    const ctx: CrudContext<TQuery> = { event, db, query, lang }

    const builder = await config.buildListQuery(ctx)
    const filters: BuildFiltersOptions = {
      page: (query as Record<string, unknown>).page as number,
      pageSize: (query as Record<string, unknown>).pageSize as number,
      search: ((query as Record<string, unknown>).search as string) ?? ((query as Record<string, unknown>).q as string),
      sort: { field: (query as Record<string, unknown>).sort as string, direction: (query as Record<string, unknown>).direction as 'asc' | 'desc' },
      status: (query as Record<string, unknown>).status as string,
      ...(builder.filters ?? {}),
    }

    const { query: filteredQuery, totalItems, page, pageSize, resolvedSortField, resolvedSortDirection } = await buildFilters(builder.baseQuery, filters)

    const rows = (await filteredQuery.execute()) as TRow[]
    const transformed = builder.transformRows ? await builder.transformRows(rows, ctx) : rows
    const data = builder.skipFallbackMark ? transformed : (Array.isArray(transformed) ? markLanguageFallback(transformed as Record<string, unknown>[], lang) : markLanguageFallback(transformed as Record<string, unknown>, lang))

    const metaFromBuilder = builder.logMeta
      ? builder.logMeta({ rows, ctx, page, pageSize, totalItems })
      : {}

    logger?.info?.({
      scope: `${config.logScope ?? config.entity}.list`,
      entity: config.entity,
      page,
      pageSize,
      count: Array.isArray(data) ? data.length : 0,
      totalItems,
      search: (filters.search as string | null) ?? null,
      sort: (resolvedSortField as string | null) ?? null,
      direction: resolvedSortDirection ?? null,
      lang,
      ...metaFromBuilder,
      timeMs: Date.now() - startedAt,
    }, 'List handler completed')

    return createPaginatedResponse(data as Record<string, any>[], totalItems, page, pageSize, {
      search: (filters.search as string | null) ?? null,
      lang,
      extraMeta: metaFromBuilder,
    })
  })

  const create = defineEventHandler(async (event) => {
    const startedAt = Date.now()
    const logger = event.context.logger ?? (globalThis as unknown as { logger: { info: (data: unknown, msg: string) => void } }).logger
    
    // JSON Payload Size Limit (Senior Critic #2)
    const contentLength = Number(getRequestHeader(event, 'content-length'))
    const MAX_JSON_SIZE = 1024 * 500 // 500KB
    if (contentLength > MAX_JSON_SIZE) {
      throw createError({ statusCode: 413, statusMessage: 'Payload too large. Max 500KB.' })
    }

    const raw = await readBody(event)
    const body = config.schema.create.parse(raw) as TCreate
    const user = event.context.user
    const lang = (body as Record<string, unknown>).lang ? String((body as Record<string, unknown>).lang).toLowerCase() : 'en'
    const db = getDb(event)
    const ctx: CrudContext<TCreate> = { event, db, query: body, lang }

    const { baseData, translationData } = config.mutations.buildCreatePayload(body, ctx)
    
    // Add created_by if column exists in table (we assume it does based on schema)
    const baseDataWithUser = { ...baseData, created_by: user?.id }

    if (translation) {
      const upsertResult = await translatableUpsert({
        event,
        baseTable: config.baseTable,
        translationTable: translation.table,
        foreignKey: translation.foreignKey,
        languageKey: translation.languageKey,
        defaultLang: translation.defaultLang,
        baseData: baseDataWithUser as Record<string, unknown>,
        translationData: translationData as Record<string, unknown> | null,
        lang,
        select: async (database, id, langCode) => config.selectOne({ event, db: database, query: body as any, lang: langCode }, id),
      })
      logger?.info?.({
        scope: `${config.logScope ?? config.entity}.create`,
        entity: config.entity,
        id: upsertResult.id,
        lang: upsertResult.lang,
        timeMs: Date.now() - startedAt,
      }, 'Entity created')
      return createResponse(upsertResult.row, null)
    }

    const insert = await db
      .insertInto(config.baseTable)
      .values(baseDataWithUser as any)
      .returning(idColumn as any)
      .executeTakeFirst()

    if (!insert) {
      throw createError({ statusCode: 500, statusMessage: `Failed to create ${config.entity}` })
    }

    const id = Number((insert as Record<string, unknown>)[idColumn])
    const row = await config.selectOne({ event, db, query: body as any, lang }, id)
    logger?.info?.({ scope: `${config.logScope ?? config.entity}.create`, entity: config.entity, id, timeMs: Date.now() - startedAt }, 'Entity created')
    return createResponse(row ? markLanguageFallback(row, lang) : row, null)
  })

  const detail = defineEventHandler(async (event) => {
    const startedAt = Date.now()
    const logger = event.context.logger ?? (globalThis as unknown as { logger: { info: (data: unknown, msg: string) => void } }).logger
    const paramsId = Number(event.context.params?.id)
    if (!Number.isFinite(paramsId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid id parameter' })
    }
    const query = parseQuery(event, deleteSchema, { scope: `${config.logScope ?? config.entity}.detail.query` })
    const lang = resolveLangFromQuery(query as Record<string, unknown>)
    const db = getDb(event)
    const ctx: CrudContext<any> = { event, db, query, lang }
    const row = await config.selectOne(ctx, paramsId)
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: `${config.entity} not found` })
    }
    const normalized = markLanguageFallback(row, lang)
    logger?.info?.({ scope: `${config.logScope ?? config.entity}.detail`, entity: config.entity, id: paramsId, lang, timeMs: Date.now() - startedAt }, 'Entity detail fetched')
    return createResponse(normalized, null)
  })

  const update = defineEventHandler(async (event) => {
    const startedAt = Date.now()
    const logger = event.context.logger ?? (globalThis as unknown as { logger: { info: (data: unknown, msg: string) => void } }).logger
    const paramsId = Number(event.context.params?.id)
    if (!Number.isFinite(paramsId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid id parameter' })
    }

    // JSON Payload Size Limit (Senior Critic #2)
    const contentLength = Number(getRequestHeader(event, 'content-length'))
    const MAX_JSON_SIZE = 1024 * 500 // 500KB
    if (contentLength > MAX_JSON_SIZE) {
      throw createError({ statusCode: 413, statusMessage: 'Payload too large. Max 500KB.' })
    }

    const raw = await readBody(event)
    const body = config.schema.update.parse(raw) as TUpdate
    const user = event.context.user
    const lang = (body as Record<string, unknown>).lang ? String((body as Record<string, unknown>).lang).toLowerCase() : 'en'
    const modifiedAt = (body as Record<string, unknown>).modified_at ? String((body as Record<string, unknown>).modified_at) : null
    const db = getDb(event)
    const ctx: CrudContext<TUpdate> = { event, db, query: body, lang }
    const { baseData, translationData } = config.mutations.buildUpdatePayload(body, ctx)
    
    // Add updated_by if column exists
    const baseDataWithUser = { ...baseData, updated_by: user?.id }

    if (translation) {
      const upsertResult = await translatableUpsert({
        event,
        id: paramsId,
        baseTable: config.baseTable,
        translationTable: translation.table,
        foreignKey: translation.foreignKey,
        languageKey: translation.languageKey,
        defaultLang: translation.defaultLang,
        baseData: baseDataWithUser as Record<string, unknown>,
        translationData: translationData as Record<string, unknown> | null,
        lang,
        modifiedAt,
        select: async (database, id, langCode) => config.selectOne({ event, db: database, query: body as any, lang: langCode }, id),
      })
      logger?.info?.({
        scope: `${config.logScope ?? config.entity}.update`,
        entity: config.entity,
        id: upsertResult.id,
        lang: upsertResult.lang,
        timeMs: Date.now() - startedAt,
      }, 'Entity updated')
      return createResponse(upsertResult.row, null)
    }

    if (baseData && Object.keys(baseData).length) {
      let query = db
        .updateTable(config.baseTable)
        .set(baseDataWithUser as any)
        .where(idColumn as any, '=', paramsId)

      if (modifiedAt) {
        query = query.where('modified_at' as any, '=', modifiedAt)
      }

      const result = await query.executeTakeFirst()

      if (modifiedAt && Number(result.numUpdatedRows) === 0) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Conflict: The entity has been modified by another user.',
        })
      }
    }
    const row = await config.selectOne({ event, db, query: body as any, lang }, paramsId)
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: `${config.entity} not found` })
    }
    logger?.info?.({ scope: `${config.logScope ?? config.entity}.update`, entity: config.entity, id: paramsId, lang, timeMs: Date.now() - startedAt }, 'Entity updated')
    return createResponse(markLanguageFallback(row, lang), null)
  })

  const remove = defineEventHandler(async (event) => {
    const startedAt = Date.now()
    const logger = event.context.logger ?? (globalThis as unknown as { logger: { info: (data: unknown, msg: string) => void } }).logger
    const paramsId = Number(event.context.params?.id)
    if (!Number.isFinite(paramsId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid id parameter' })
    }
    const query = parseQuery(event, deleteSchema, { scope: `${config.logScope ?? config.entity}.delete.query` })
    const lang = resolveLangFromQuery(query as Record<string, unknown>)
    const db = getDb(event)

    if (translation) {
      const result = await deleteLocalizedEntity({
        event,
        baseTable: config.baseTable,
        translationTable: translation.table,
        foreignKey: translation.foreignKey,
        languageKey: translation.languageKey,
        defaultLang: translation.defaultLang,
        id: paramsId,
        lang,
      })
      logger?.info?.({
        scope: `${config.logScope ?? config.entity}.delete`,
        entity: config.entity,
        id: paramsId,
        lang: result.lang,
        deletedBase: result.deletedBase,
        deletedTranslation: result.deletedTranslation,
        timeMs: Date.now() - startedAt,
      }, 'Entity deleted')
      return createResponse(result, null)
    }

    await db.deleteFrom(config.baseTable).where(idColumn as any, '=', paramsId).execute()
    logger?.info?.({ scope: `${config.logScope ?? config.entity}.delete`, entity: config.entity, id: paramsId, timeMs: Date.now() - startedAt }, 'Entity deleted')
    return createResponse({ id: paramsId }, null)
  })

  return { list, create, detail, update, remove }
}
