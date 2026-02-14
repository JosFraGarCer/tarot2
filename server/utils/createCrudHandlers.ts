/* eslint-disable @typescript-eslint/no-explicit-any */
// server/utils/createCrudHandlers.ts
import { defineEventHandler, readBody, createError, type H3Event } from 'h3'
import type { ZodTypeAny } from 'zod'
import { z } from 'zod'
import { sql, type Kysely, type SelectQueryBuilder } from 'kysely'
import type { DB } from '../database/types'
import { parseQuery } from './parseQuery'
import { buildFilters, type BuildFiltersOptions } from './filters'
import { createPaginatedResponse, createResponse } from './response'
import { markLanguageFallback } from './language'
import { translatableUpsert } from './translatableUpsert'
import { getRequestedLanguage } from './i18n'
import type { AuthenticatedUser } from '@shared/schemas/common'
import { canTransition } from '@shared/editorial/guard'
import type { EditorialContext, EditorialUserContext } from '@shared/editorial/guard'
import type { CardStatus } from '@shared/editorial/card-status'
import { cardStatusTransitions } from '@shared/editorial/transitions'
import { fetchEditorialState } from './editorialStateLoader'
import { applyEditorialTransition, type MutationExecutor } from './editorialTransitionService'
import { upsertEditorialState, deleteEditorialState } from './editorialStateSync'
import { upsertTranslationState, deleteTranslationState, deleteAllTranslationStates } from './translationStateSync'
import { requireDb } from './requireDb'

export interface CrudContext<TQuery> {
  event: H3Event
  db: Kysely<DB>
  query: TQuery
  lang: string
  user: AuthenticatedUser | null
}

export interface EagerLoadConfig<TQuery> {
  key: string
  fetch: (db: Kysely<DB>, ids: number[], lang: string, ctx: CrudContext<TQuery>) => Promise<Map<number, any>>
  defaultValue?: any
}

export interface ListBuilder<TQuery, TRow> {
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

export interface MutationsPayload<TCreate, TUpdate> {
  buildCreatePayload: (input: TCreate, ctx: CrudContext<TCreate>) => {
    baseData?: Record<string, unknown>
    translationData?: Record<string, unknown> | null
    lang?: string | null
  }
  buildUpdatePayload: (input: TUpdate, ctx: CrudContext<TUpdate>) => {
    baseData?: Record<string, unknown>
    translationData?: Record<string, unknown> | null
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
  TQuery = z.infer<TQuerySchema>,
  TCreate = z.infer<TCreateSchema>,
  TUpdate = z.infer<TUpdateSchema>,
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
  /**
   * Declarative eager loading of related entities (e.g., tags)
   * This runs automatically after buildListQuery and before transformRows
   */
  eagerLoad?: EagerLoadConfig<TQuery, TRow>[]
  buildListQuery: (
    ctx: CrudContext<TQuery>,
  ) => Promise<ListBuilder<TQuery, TRow>> | ListBuilder<TQuery, TRow>
  selectOne: (
    ctx: CrudContext<TQuery>,
    id: number,
  ) => Promise<TRow | undefined>
  mutations: MutationsPayload<TCreate, TUpdate>
  onEntityCreate?: (entityId: number, baseData: Record<string, any>, userId: number | null) => Promise<void>
  onTranslationUpsert?: (entityId: number, lang: string, userId: number | null) => Promise<void>
  onTranslationDelete?: (entityId: number, lang: string) => Promise<void>
  onBaseDelete?: (entityId: number) => Promise<void>
  logScope?: string
  deleteQuerySchema?: z.ZodSchema<any>
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

  const TABLES_WITH_EFFECTS = new Set(['base_card', 'world_card', 'facet', 'base_skills'])

  async function buildEditorialContext(executor: MutationExecutor, entityId: number): Promise<EditorialContext> {
    let hasAtLeastOneTranslation = true
    if (translation) {
      const translationRow = await executor
        .selectFrom(translation.table)
        .select(sql`1`.as('one'))
        .where(sql`${sql.ref(translation.foreignKey)}`, '=', entityId)
        .executeTakeFirst()
      hasAtLeastOneTranslation = !!translationRow
    }

    let hasEffectsDefined = true
    const baseTableStr = String(config.baseTable)
    if (TABLES_WITH_EFFECTS.has(baseTableStr)) {
      const effectRow = await executor
        .selectFrom('card_effects')
        .select(sql`1`.as('one'))
        .where('entity_type', '=', baseTableStr)
        .where('entity_id', '=', entityId)
        .executeTakeFirst()

      if (!effectRow) {
        const legacyRow = await executor
          .selectFrom(config.baseTable)
          .select([sql`legacy_effects`.as('legacy_effects'), sql`effects`.as('effects')])
          .where(sql`${sql.ref(idColumn)}`, '=', entityId)
          .executeTakeFirst()

        const legacy = (legacyRow as any)?.legacy_effects === true
        const inlineEffects = (legacyRow as any)?.effects
        const hasInline = legacy && inlineEffects != null
          && typeof inlineEffects === 'object'
          && Object.keys(inlineEffects).length > 0

        hasEffectsDefined = hasInline
      }
    }

    return {
      hasBaseContent: true,
      hasAtLeastOneTranslation,
      hasEffectsDefined,
    }
  }

  function buildUserContext(user: AuthenticatedUser | null): EditorialUserContext | null {
    if (!user) return null
    return {
      roles: user.roles?.map(r => r.name) ?? [],
      permissions: user.permissions ?? {},
    }
  }

  async function computeEditorialMetadata(
    db: Kysely<DB>,
    entityId: number,
    currentStatus: string,
    user?: AuthenticatedUser | null,
  ): Promise<{ status: string; allowedTransitions: string[]; publishReady: boolean; blockingReasons: string[] }> {
    const status = currentStatus as CardStatus
    const candidates = cardStatusTransitions[status] ?? []
    const editorialCtx = await buildEditorialContext(db, entityId)
    const userCtx = buildUserContext(user ?? null)

    const allowedTransitions: string[] = []
    const blockingReasons: string[] = []

    for (const candidate of candidates) {
      const result = canTransition(status, candidate, editorialCtx, userCtx)
      if (result.allowed) {
        allowedTransitions.push(candidate)
      } else if (result.reason) {
        blockingReasons.push(result.reason)
      }
    }

    const publishResult = canTransition(status, 'published' as CardStatus, editorialCtx, userCtx)
    const publishReady = publishResult.allowed

    return {
      status: currentStatus,
      allowedTransitions,
      publishReady,
      blockingReasons: [...new Set(blockingReasons)],
    }
  }

  async function attachEditorialMetadata(db: Kysely<DB>, row: any, entityId: number, user?: AuthenticatedUser | null): Promise<any> {
    if (!row || typeof row !== 'object') return row
    const status = row.status
    if (typeof status !== 'string') return row
    const editorial = await computeEditorialMetadata(db, entityId, status, user)
    const editorial_state = await fetchEditorialState(db, String(config.baseTable), entityId)
    return { ...row, editorial, editorial_state }
  }

  const list = defineEventHandler(async (event) => {
    const startedAt = Date.now()
    const logger = event.context.logger ?? (globalThis as any).logger
    const db = requireDb(event)
    const query = parseQuery(event, config.schema.query, { scope: `${config.logScope ?? config.entity}.list.query` })
    const lang = resolveLangFromQuery(query as Record<string, any>)
    const user = (event.context.user as AuthenticatedUser) ?? null
    const ctx: CrudContext<TQuery> = { event, db, query, lang, user }

    const builder = await config.buildListQuery(ctx)
    const q = query as any
    const filters: BuildFiltersOptions = {
      page: q.page,
      pageSize: q.pageSize,
      search: q.search ?? q.q,
      sort: { field: q.sort, direction: q.direction },
      status: q.status,
      ...(builder.filters ?? {}),
    }

    const { query: filteredQuery, totalItems, page, pageSize, resolvedSortField, resolvedSortDirection } = await buildFilters(builder.baseQuery, filters)

    const rows = (await filteredQuery.execute()) as TRow[]

    // --- Declarative Eager Loading ---
    if (config.eagerLoad && rows.length > 0) {
      const ids = rows
        .map((r: any) => r[idColumn])
        .filter((id) => id != null) as number[]

      if (ids.length > 0) {
        for (const loader of config.eagerLoad) {
          const dataMap = await loader.fetch(db, ids, lang, ctx)
          const fallback = loader.defaultValue !== undefined ? loader.defaultValue : []
          for (const row of rows as any[]) {
            row[loader.key] = dataMap.get(row[idColumn]) ?? fallback
          }
        }
      }
    }

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
    const db = requireDb(event)
    const raw = await readBody(event)
    const body = config.schema.create.parse(raw) as TCreate
    const lang = (body as any).lang ? String((body as any).lang).toLowerCase() : 'en'
    const user = (event.context.user as AuthenticatedUser) ?? null
    const ctx: CrudContext<TCreate> = { event, db, query: body, lang, user }

    if (!user?.permissions?.canEditContent) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Permission required (canEditContent)',
      })
    }

    const { baseData, translationData } = config.mutations.buildCreatePayload(body, ctx)
    const entityCode = String(config.baseTable)

    if (translation) {
      let createdId: number | null = null
      let resolvedLang = lang

      await db.transaction().execute(async (trx) => {
        const upsertResult = await translatableUpsert({
          event,
          db,
          executor: trx,
          baseTable: config.baseTable,
          translationTable: translation.table,
          foreignKey: translation.foreignKey,
          languageKey: translation.languageKey,
          defaultLang: translation.defaultLang,
          baseData,
          translationData,
          lang,
          select: async (database, id, langCode) =>
            config.selectOne({ event, db: database, query: body, lang: langCode }, id),
        })

        createdId = upsertResult.id
        resolvedLang = upsertResult.lang

        const statusValue =
          typeof (baseData as Record<string, unknown> | undefined)?.status === 'string'
            ? String((baseData as Record<string, unknown>).status)
            : 'draft'

        const isActiveValue =
          typeof (baseData as Record<string, unknown> | undefined)?.is_active === 'boolean'
            ? Boolean((baseData as Record<string, unknown>).is_active)
            : true

        await upsertEditorialState(trx, entityCode, upsertResult.id, {
          status: statusValue,
          isActive: isActiveValue,
          createdBy: user?.id ?? null,
          updatedBy: user?.id ?? null,
        })

        await upsertTranslationState(trx, entityCode, upsertResult.id, upsertResult.lang, user?.id ?? null)
      })

      if (createdId == null) {
        throw createError({ statusCode: 500, statusMessage: `Failed to create ${config.entity}` })
      }

      const row = await config.selectOne({ event, db, query: body, lang: resolvedLang }, createdId)
      if (!row) {
        throw createError({ statusCode: 404, statusMessage: `${config.entity} not found` })
      }

      const enrichedRow = await attachEditorialMetadata(db, markLanguageFallback(row, resolvedLang), createdId, user)
      logger?.info?.({
        scope: `${config.logScope ?? config.entity}.create`,
        entity: config.entity,
        id: createdId,
        lang: resolvedLang,
        timeMs: Date.now() - startedAt,
      }, 'Entity created')
      return createResponse(enrichedRow, null)
    }

    let id: number | null = null
    await db.transaction().execute(async (trx) => {
      const insert = await trx
        .insertInto(config.baseTable)
        .values(baseData ?? {})
        .returning(idColumn as any)
        .executeTakeFirst()

      if (!insert) {
        throw createError({ statusCode: 500, statusMessage: `Failed to create ${config.entity}` })
      }

      id = Number((insert as Record<string, unknown>)[idColumn])

      const statusValue =
        typeof (baseData as Record<string, unknown> | undefined)?.status === 'string'
          ? String((baseData as Record<string, unknown>).status)
          : 'draft'

      const isActiveValue =
        typeof (baseData as Record<string, unknown> | undefined)?.is_active === 'boolean'
          ? Boolean((baseData as Record<string, unknown>).is_active)
          : true

      await upsertEditorialState(trx, entityCode, id, {
        status: statusValue,
        isActive: isActiveValue,
        createdBy: user?.id ?? null,
        updatedBy: user?.id ?? null,
      })
    })

    if (id == null) {
      throw createError({ statusCode: 500, statusMessage: `Failed to create ${config.entity}` })
    }

    const row = await config.selectOne({ event, db, query: body, lang }, id)
    const enriched = row ? await attachEditorialMetadata(db, markLanguageFallback(row, lang), id, user) : row
    logger?.info?.({ scope: `${config.logScope ?? config.entity}.create`, entity: config.entity, id, timeMs: Date.now() - startedAt }, 'Entity created')
    return createResponse(enriched, null)
  })

  const detail = defineEventHandler(async (event) => {
    const startedAt = Date.now()
    const logger = event.context.logger ?? (globalThis as any).logger
    const db = requireDb(event)
    const paramsId = Number(event.context.params?.id)
    if (!Number.isFinite(paramsId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid id parameter' })
    }
    const query = parseQuery(event, deleteSchema, { scope: `${config.logScope ?? config.entity}.detail.query` })
    const lang = resolveLangFromQuery(query as any)
    const user = (event.context.user as AuthenticatedUser) ?? null
    const ctx: CrudContext<any> = { event, db, query, lang, user }
    const row = await config.selectOne(ctx, paramsId)
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: `${config.entity} not found` })
    }
    const normalized = markLanguageFallback(row, lang)
    const enriched = await attachEditorialMetadata(db, normalized, paramsId, user)
    logger?.info?.({ scope: `${config.logScope ?? config.entity}.detail`, entity: config.entity, id: paramsId, lang, timeMs: Date.now() - startedAt }, 'Entity detail fetched')
    return createResponse(enriched, null)
  })

  const update = defineEventHandler(async (event) => {
    const startedAt = Date.now()
    const logger = event.context.logger ?? (globalThis as any).logger
    const db = requireDb(event)
    const paramsId = Number(event.context.params?.id)
    if (!Number.isFinite(paramsId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid id parameter' })
    }
    const raw = await readBody(event)
    const body = config.schema.update.parse(raw)
    const lang = (body as any).lang ? String((body as any).lang).toLowerCase() : 'en'
    const user = (event.context.user as AuthenticatedUser) ?? null
    const ctx: CrudContext<any> = { event, db, query: body, lang, user }
    const entityCode = String(config.baseTable)
    const requestedStatus =
      typeof (body as Record<string, unknown>).status === 'string'
        ? (String((body as Record<string, unknown>).status) as CardStatus)
        : null

    if (!user?.permissions?.canEditContent) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Permission required (canEditContent)',
      })
    }
    
    const { baseData, translationData } = config.mutations.buildUpdatePayload(body, ctx)
    const basePatch = { ...(baseData ?? {}) }
    if (requestedStatus) {
      delete (basePatch as Record<string, unknown>).status
    }

    let finalId = paramsId

    await db.transaction().execute(async (trx) => {
      if (translation) {
        const upsertResult = await translatableUpsert({
          event,
          db,
          executor: trx,
          id: paramsId,
          baseTable: config.baseTable,
          translationTable: translation.table,
          foreignKey: translation.foreignKey,
          languageKey: translation.languageKey,
          defaultLang: translation.defaultLang,
          baseData: basePatch,
          translationData,
          lang,
          select: async (database, id, langCode) =>
            config.selectOne({ event, db: database, query: body, lang: langCode }, id),
        })
        finalId = upsertResult.id

        if (translationData && Object.keys(translationData).length > 0) {
          await upsertTranslationState(trx, entityCode, upsertResult.id, upsertResult.lang, user?.id ?? null)
        }
      } else {
        if (Object.keys(basePatch).length > 0) {
          await trx
            .updateTable(config.baseTable)
            .set(basePatch)
            .where(sql.ref(idColumn), '=', paramsId)
            .execute()
        } else if (!requestedStatus) {
          const exists = await trx
            .selectFrom(config.baseTable)
            .select(idColumn as any)
            .where(sql.ref(idColumn), '=', paramsId)
            .executeTakeFirst()
          if (!exists) {
            throw createError({ statusCode: 404, statusMessage: `${config.entity} not found` })
          }
        }
      }

      if (requestedStatus) {
        const editorialCtx = await buildEditorialContext(trx, finalId)
        const userCtx = buildUserContext(user)
        const transitionResult = await applyEditorialTransition({
          db: trx,
          baseTable: config.baseTable,
          idColumn,
          entityCode,
          entityId: finalId,
          requestedStatus,
          user,
          userCtx,
          editorialCtx,
          logger,
        })

        if (transitionResult) {
          await upsertEditorialState(trx, entityCode, finalId, {
            status: transitionResult.toStatus,
            isActive:
              typeof (basePatch as Record<string, unknown>).is_active === 'boolean'
                ? Boolean((basePatch as Record<string, unknown>).is_active)
                : true,
            updatedBy: user?.id ?? null,
          })
        }
      }
    })

    const row = await config.selectOne({ event, db, query: body, lang }, finalId)
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: `${config.entity} not found` })
    }
    const enriched = await attachEditorialMetadata(db, markLanguageFallback(row, lang), finalId, user)
    logger?.info?.({ scope: `${config.logScope ?? config.entity}.update`, entity: config.entity, id: finalId, lang, timeMs: Date.now() - startedAt }, 'Entity updated')
    return createResponse(enriched, null)
  })

  const remove = defineEventHandler(async (event) => {
    const startedAt = Date.now()
    const logger = event.context.logger ?? (globalThis as any).logger
    const db = requireDb(event)
    const paramsId = Number(event.context.params?.id)
    if (!Number.isFinite(paramsId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid id parameter' })
    }
    const query = parseQuery(event, deleteSchema, { scope: `${config.logScope ?? config.entity}.delete.query` })
    const lang = resolveLangFromQuery(query as any)
    const entityCode = String(config.baseTable)
    const user = (event.context.user as AuthenticatedUser) ?? null

    if (translation) {
      const requestedLang = (lang || translation.defaultLang || 'en').toLowerCase()
      const defaultLang = (translation.defaultLang || 'en').toLowerCase()

      if (requestedLang !== defaultLang && !user?.permissions?.canTranslate) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Permission required (canTranslate)',
        })
      }

      if (requestedLang === defaultLang && !user?.permissions?.canEditContent) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Permission required (canEditContent)',
        })
      }

      const languageKey = translation.languageKey ?? 'language_code'

      const result = await db.transaction().execute(async (trx) => {
        if (requestedLang === defaultLang) {
          const deletedBase = await trx
            .deleteFrom(config.baseTable)
            .where(sql.ref(idColumn), '=', paramsId)
            .returning(idColumn as any)
            .executeTakeFirst()

          if (!deletedBase) {
            throw createError({ statusCode: 404, statusMessage: `${config.entity} not found` })
          }

          await trx
            .deleteFrom(translation.table)
            .where(sql.ref(translation.foreignKey), '=', paramsId)
            .execute()

          await deleteAllTranslationStates(trx, entityCode, paramsId)
          await deleteEditorialState(trx, entityCode, paramsId)

          return { deletedBase: true, deletedTranslation: true, lang: requestedLang }
        }

        const deletedTranslation = await trx
          .deleteFrom(translation.table)
          .where(sql.ref(translation.foreignKey), '=', paramsId)
          .where(sql.ref(languageKey), '=', requestedLang)
          .returning('id' as any)
          .executeTakeFirst()

        if (!deletedTranslation) {
          throw createError({ statusCode: 404, statusMessage: 'Translation not found' })
        }

        await deleteTranslationState(trx, entityCode, paramsId, requestedLang)
        return { deletedBase: false, deletedTranslation: true, lang: requestedLang }
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

    if (!user?.permissions?.canEditContent) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Permission required (canEditContent)',
      })
    }
    await db.transaction().execute(async (trx) => {
      const deleted = await trx
        .deleteFrom(config.baseTable)
        .where(sql.ref(idColumn), '=', paramsId)
        .returning(idColumn as any)
        .executeTakeFirst()

      if (!deleted) {
        throw createError({ statusCode: 404, statusMessage: `${config.entity} not found` })
      }

      await deleteAllTranslationStates(trx, entityCode, paramsId)
      await deleteEditorialState(trx, entityCode, paramsId)
    })

    logger?.info?.({ scope: `${config.logScope ?? config.entity}.delete`, entity: config.entity, id: paramsId, timeMs: Date.now() - startedAt }, 'Entity deleted')
    return createResponse({ id: paramsId }, null)
  })

  return { list, create, detail, update, remove }
}
