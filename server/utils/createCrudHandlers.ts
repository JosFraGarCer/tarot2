// server/utils/createCrudHandlers.ts
import { defineEventHandler, readBody, createError } from 'h3'
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
  baseQuery: SelectQueryBuilder<DB, any, any>
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
  buildCreatePayload: (input: TCreate, ctx: CrudContext<any>) => {
    baseData?: Record<string, any>
    translationData?: Record<string, any> | null
    lang?: string | null
  }
  buildUpdatePayload: (input: TUpdate, ctx: CrudContext<any>) => {
    baseData?: Record<string, any>
    translationData?: Record<string, any> | null
    lang?: string | null
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
  TQuery = any,
  TCreate = any,
  TUpdate = any,
  TRow = any,
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
  deleteQuerySchema?: ZodSchema<any>
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
  TRow = any,
>(config: CrudHandlersConfig<TQuerySchema, TCreateSchema, TUpdateSchema, any, any, any, TRow>): CrudHandlers {
  const db = globalThis.db as Kysely<DB>
  if (!db) throw new Error('Global database instance not available')

  const translation = config.translation === undefined ? {
    table: `${String(config.baseTable)}_translations` as keyof DB,
    foreignKey: `${String(config.baseTable).replace(/s$/, '')}_id`,
    languageKey: 'language_code',
    defaultLang: 'en',
  } : config.translation

  const idColumn = config.idColumn ?? 'id'
  const deleteSchema = config.deleteQuerySchema ?? defaultLangQuerySchema()

  function resolveLangFromQuery(query: Record<string, any>): string {
    return getRequestedLanguage(query)
  }

  const list = defineEventHandler(async (event) => {
    const startedAt = Date.now()
    const logger = event.context.logger ?? (globalThis as any).logger
    const query = parseQuery(event, config.schema.query, { scope: `${config.logScope ?? config.entity}.list.query` })
    const lang = resolveLangFromQuery(query as any)
    const ctx: CrudContext<any> = { event, db, query, lang }

    const builder = await config.buildListQuery(ctx)
    const filters: BuildFiltersOptions = {
      page: (query as any).page,
      pageSize: (query as any).pageSize,
      search: (query as any).search ?? (query as any).q,
      sort: { field: (query as any).sort, direction: (query as any).direction },
      status: (query as any).status,
      ...(builder.filters ?? {}),
    }

    const { query: filteredQuery, totalItems, page, pageSize, resolvedSortField, resolvedSortDirection } = await buildFilters(builder.baseQuery, filters)

    const rows = (await filteredQuery.execute()) as TRow[]
    const transformed = builder.transformRows ? await builder.transformRows(rows, ctx) : rows
    const data = builder.skipFallbackMark ? transformed : (Array.isArray(transformed) ? markLanguageFallback(transformed, lang) : transformed)

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
      search: filters.search ?? null,
      sort: resolvedSortField ?? null,
      direction: resolvedSortDirection ?? null,
      lang,
      ...metaFromBuilder,
      timeMs: Date.now() - startedAt,
    }, 'List handler completed')

    return createPaginatedResponse(data as any[], totalItems, page, pageSize, {
      search: filters.search ?? null,
      lang,
      extraMeta: metaFromBuilder,
    })
  })

  const create = defineEventHandler(async (event) => {
    const startedAt = Date.now()
    const logger = event.context.logger ?? (globalThis as any).logger
    const raw = await readBody(event)
    const body = config.schema.create.parse(raw)
    const lang = (body as any).lang ? String((body as any).lang).toLowerCase() : 'en'
    const ctx: CrudContext<any> = { event, db, query: body, lang }

    const { baseData, translationData } = config.mutations.buildCreatePayload(body, ctx)

    if (translation) {
      const upsertResult = await translatableUpsert({
        event,
        baseTable: config.baseTable,
        translationTable: translation.table,
        foreignKey: translation.foreignKey,
        languageKey: translation.languageKey,
        defaultLang: translation.defaultLang,
        baseData,
        translationData,
        lang,
        select: async (database, id, langCode) => config.selectOne({ event, db: database, query: body, lang: langCode }, id),
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
      .values(baseData ?? {})
      .returning(idColumn)
      .executeTakeFirst()

    if (!insert) {
      throw createError({ statusCode: 500, statusMessage: `Failed to create ${config.entity}` })
    }

    const id = Number((insert as any)[idColumn])
    const row = await config.selectOne({ event, db, query: body, lang }, id)
    logger?.info?.({ scope: `${config.logScope ?? config.entity}.create`, entity: config.entity, id, timeMs: Date.now() - startedAt }, 'Entity created')
    return createResponse(row ? markLanguageFallback(row, lang) : row, null)
  })

  const detail = defineEventHandler(async (event) => {
    const startedAt = Date.now()
    const logger = event.context.logger ?? (globalThis as any).logger
    const paramsId = Number(event.context.params?.id)
    if (!Number.isFinite(paramsId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid id parameter' })
    }
    const query = parseQuery(event, deleteSchema, { scope: `${config.logScope ?? config.entity}.detail.query` })
    const lang = resolveLangFromQuery(query as any)
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
    const logger = event.context.logger ?? (globalThis as any).logger
    const paramsId = Number(event.context.params?.id)
    if (!Number.isFinite(paramsId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid id parameter' })
    }
    const raw = await readBody(event)
    const body = config.schema.update.parse(raw)
    const lang = (body as any).lang ? String((body as any).lang).toLowerCase() : 'en'
    const ctx: CrudContext<any> = { event, db, query: body, lang }
    const { baseData, translationData } = config.mutations.buildUpdatePayload(body, ctx)

    if (translation) {
      const upsertResult = await translatableUpsert({
        event,
        id: paramsId,
        baseTable: config.baseTable,
        translationTable: translation.table,
        foreignKey: translation.foreignKey,
        languageKey: translation.languageKey,
        defaultLang: translation.defaultLang,
        baseData,
        translationData,
        lang,
        select: async (database, id, langCode) => config.selectOne({ event, db: database, query: body, lang: langCode }, id),
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
      await db
        .updateTable(config.baseTable)
        .set(baseData)
        .where(idColumn, '=', paramsId)
        .execute()
    }
    const row = await config.selectOne({ event, db, query: body, lang }, paramsId)
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: `${config.entity} not found` })
    }
    logger?.info?.({ scope: `${config.logScope ?? config.entity}.update`, entity: config.entity, id: paramsId, lang, timeMs: Date.now() - startedAt }, 'Entity updated')
    return createResponse(markLanguageFallback(row, lang), null)
  })

  const remove = defineEventHandler(async (event) => {
    const startedAt = Date.now()
    const logger = event.context.logger ?? (globalThis as any).logger
    const paramsId = Number(event.context.params?.id)
    if (!Number.isFinite(paramsId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid id parameter' })
    }
    const query = parseQuery(event, deleteSchema, { scope: `${config.logScope ?? config.entity}.delete.query` })
    const lang = resolveLangFromQuery(query as any)

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

    await db.deleteFrom(config.baseTable).where(idColumn, '=', paramsId).execute()
    logger?.info?.({ scope: `${config.logScope ?? config.entity}.delete`, entity: config.entity, id: paramsId, timeMs: Date.now() - startedAt }, 'Entity deleted')
    return createResponse({ id: paramsId }, null)
  })

  return { list, create, detail, update, remove }
}
