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
import { deleteLocalizedEntity } from './deleteLocalizedEntity'
import { getRequestedLanguage } from './i18n'
import type { AuthenticatedUser } from '@shared/schemas/common'
import { canTransition } from '@shared/editorial/guard'
import type { EditorialContext, EditorialUserContext } from '@shared/editorial/guard'
import type { CardStatus } from '@shared/editorial/card-status'
import { cardStatusTransitions } from '@shared/editorial/transitions'
import { fetchEditorialState } from './editorialStateLoader'

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

  const TABLES_WITH_EFFECTS = new Set(['base_card', 'world_card', 'facet', 'base_skills'])

  async function buildEditorialContext(entityId: number): Promise<EditorialContext> {
    let hasAtLeastOneTranslation = true
    if (translation) {
      const translationRow = await db
        .selectFrom(translation.table)
        .select(sql`1`.as('one'))
        .where(sql`${sql.ref(translation.foreignKey)}`, '=', entityId)
        .executeTakeFirst()
      hasAtLeastOneTranslation = !!translationRow
    }

    let hasEffectsDefined = true
    const baseTableStr = String(config.baseTable)
    if (TABLES_WITH_EFFECTS.has(baseTableStr)) {
      const effectRow = await db
        .selectFrom('card_effects')
        .select(sql`1`.as('one'))
        .where('entity_type', '=', baseTableStr)
        .where('entity_id', '=', entityId)
        .executeTakeFirst()

      if (!effectRow) {
        const legacyRow = await db
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

  /**
   * Validates an editorial status transition and, on success:
   * 1. Inserts an append-only audit log entry (editorial_audit_log)
   * 2. Captures a pre-transition snapshot for revision creation
   *
   * Returns the previous status so the caller can create a content revision
   * after the entity update is persisted.
   * Returns null if currentStatus === requestedStatus (no-op).
   */
  async function enforceEditorialTransition(
    entityId: number,
    requestedStatus: string,
    user: AuthenticatedUser | null,
    logger?: any,
  ): Promise<{ fromStatus: string; toStatus: string; prevSnapshot: Record<string, unknown> } | null> {
    const currentRow = await db
      .selectFrom(config.baseTable)
      .selectAll()
      .where(sql`${sql.ref(idColumn)}`, '=', entityId)
      .executeTakeFirst()

    if (!currentRow) {
      throw createError({ statusCode: 404, statusMessage: `${config.entity} not found` })
    }

    const currentStatus = String((currentRow as any).status) as CardStatus
    const nextStatus = requestedStatus as CardStatus

    if (currentStatus === nextStatus) return null

    const editorialCtx = await buildEditorialContext(entityId)
    const userCtx = buildUserContext(user)
    const result = canTransition(currentStatus, nextStatus, editorialCtx, userCtx)

    if (!result.allowed) {
      const statusCode = result.code === 'PERMISSION_DENIED' ? 403 : 400

      logger?.warn?.({
        scope: `${config.logScope ?? config.entity}.update.transition_rejected`,
        entity: config.entity,
        id: entityId,
        from: currentStatus,
        to: nextStatus,
        reason: result.reason,
        code: result.code,
      }, 'Editorial transition rejected')

      throw createError({
        statusCode,
        statusMessage: `Status transition not allowed: ${currentStatus} → ${nextStatus}. ${result.reason ?? ''}`.trim(),
      })
    }

    // A) Append-only editorial audit log
    try {
      const entityTypeId = await db
        .selectFrom('entity_types')
        .select('id')
        .where('code', '=', String(config.baseTable))
        .executeTakeFirst()

      if (entityTypeId) {
        await db
          .insertInto('editorial_audit_log')
          .values({
            entity_type: entityTypeId.id,
            entity_id: entityId,
            from_status: currentStatus as CardStatus,
            to_status: nextStatus as CardStatus,
            changed_by: user?.id ?? null,
          })
          .execute()
      }
    } catch (auditErr) {
      logger?.error?.({
        scope: `${config.logScope ?? config.entity}.audit_log`,
        entity: config.entity,
        id: entityId,
        error: auditErr instanceof Error ? auditErr.message : String(auditErr),
      }, 'Failed to insert editorial audit log (non-blocking)')
    }

    return {
      fromStatus: currentStatus,
      toStatus: nextStatus,
      prevSnapshot: { ...(currentRow as Record<string, unknown>) },
    }
  }

  /**
   * B) Auto-create a content revision after a successful status transition.
   * Called after the entity update is persisted so next_snapshot reflects the new state.
   */
  async function createTransitionRevision(
    entityId: number,
    transitionMeta: { fromStatus: string; toStatus: string; prevSnapshot: Record<string, unknown> },
    user: AuthenticatedUser | null,
    logger?: any,
  ): Promise<void> {
    try {
      const entityType = String(config.baseTable)

      // Get next version_number for this entity
      const maxVersionRow = await db
        .selectFrom('content_revisions')
        .select([sql`max(version_number)`.as('vmax')])
        .where('entity_type', '=', entityType)
        .where('entity_id', '=', entityId)
        .executeTakeFirst()
      const nextVersion = Number((maxVersionRow as any)?.vmax ?? 0) + 1

      // Fetch entity after update for next_snapshot
      const updatedRow = await db
        .selectFrom(config.baseTable)
        .selectAll()
        .where(sql`${sql.ref(idColumn)}`, '=', entityId)
        .executeTakeFirst()

      await db
        .insertInto('content_revisions')
        .values({
          entity_type: entityType,
          entity_id: entityId,
          version_number: nextVersion,
          status: transitionMeta.toStatus,
          diff: {
            status: { old: transitionMeta.fromStatus, new: transitionMeta.toStatus },
          },
          notes: `Status transition: ${transitionMeta.fromStatus} → ${transitionMeta.toStatus}`,
          prev_snapshot: transitionMeta.prevSnapshot as any,
          next_snapshot: (updatedRow as any) ?? null,
          created_by: user?.id ?? null,
        })
        .execute()

      logger?.info?.({
        scope: `${config.logScope ?? config.entity}.transition_revision`,
        entity: config.entity,
        id: entityId,
        version: nextVersion,
        from: transitionMeta.fromStatus,
        to: transitionMeta.toStatus,
      }, 'Transition revision created')
    } catch (revErr) {
      logger?.error?.({
        scope: `${config.logScope ?? config.entity}.transition_revision`,
        entity: config.entity,
        id: entityId,
        error: revErr instanceof Error ? revErr.message : String(revErr),
      }, 'Failed to create transition revision (non-blocking)')
    }
  }

  async function computeEditorialMetadata(
    entityId: number,
    currentStatus: string,
    user?: AuthenticatedUser | null,
  ): Promise<{ status: string; allowedTransitions: string[]; publishReady: boolean; blockingReasons: string[] }> {
    const status = currentStatus as CardStatus
    const candidates = cardStatusTransitions[status] ?? []
    const editorialCtx = await buildEditorialContext(entityId)
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

  async function attachEditorialMetadata(row: any, entityId: number, user?: AuthenticatedUser | null): Promise<any> {
    if (!row || typeof row !== 'object') return row
    const status = row.status
    if (typeof status !== 'string') return row
    const editorial = await computeEditorialMetadata(entityId, status, user)
    const editorial_state = await fetchEditorialState(db, String(config.baseTable), entityId)
    return { ...row, editorial, editorial_state }
  }

  const list = defineEventHandler(async (event) => {
    const startedAt = Date.now()
    const logger = event.context.logger ?? (globalThis as any).logger
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
    const raw = await readBody(event)
    const body = config.schema.create.parse(raw) as TCreate
    const lang = (body as any).lang ? String((body as any).lang).toLowerCase() : 'en'
    const user = (event.context.user as AuthenticatedUser) ?? null
    const ctx: CrudContext<TCreate> = { event, db, query: body, lang, user }

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
      if (upsertResult.wasCreated && config.onEntityCreate) {
        try {
          await config.onEntityCreate(upsertResult.id, baseData ?? {}, user?.id ?? null)
        } catch (syncErr) {
          logger?.error?.({ scope: `${config.logScope ?? config.entity}.editorial_state_sync`, id: upsertResult.id, error: syncErr instanceof Error ? syncErr.message : String(syncErr) }, 'editorial_state sync failed on create (non-blocking)')
        }
      }
      if (config.onTranslationUpsert) {
        try {
          await config.onTranslationUpsert(upsertResult.id, upsertResult.lang, user?.id ?? null)
        } catch (syncErr) {
          logger?.error?.({ scope: `${config.logScope ?? config.entity}.translation_state_sync`, id: upsertResult.id, lang: upsertResult.lang, error: syncErr instanceof Error ? syncErr.message : String(syncErr) }, 'translation_state sync failed (non-blocking)')
        }
      }
      const enrichedRow = await attachEditorialMetadata(upsertResult.row, upsertResult.id, user)
      logger?.info?.({
        scope: `${config.logScope ?? config.entity}.create`,
        entity: config.entity,
        id: upsertResult.id,
        lang: upsertResult.lang,
        timeMs: Date.now() - startedAt,
      }, 'Entity created')
      return createResponse(enrichedRow, null)
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
    if (config.onEntityCreate) {
      try {
        await config.onEntityCreate(id, baseData ?? {}, user?.id ?? null)
      } catch (syncErr) {
        logger?.error?.({ scope: `${config.logScope ?? config.entity}.editorial_state_sync`, id, error: syncErr instanceof Error ? syncErr.message : String(syncErr) }, 'editorial_state sync failed on create (non-blocking)')
      }
    }
    const row = await config.selectOne({ event, db, query: body, lang }, id)
    const enriched = row ? await attachEditorialMetadata(markLanguageFallback(row, lang), id, user) : row
    logger?.info?.({ scope: `${config.logScope ?? config.entity}.create`, entity: config.entity, id, timeMs: Date.now() - startedAt }, 'Entity created')
    return createResponse(enriched, null)
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
    const user = (event.context.user as AuthenticatedUser) ?? null
    const ctx: CrudContext<any> = { event, db, query, lang, user }
    const row = await config.selectOne(ctx, paramsId)
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: `${config.entity} not found` })
    }
    const normalized = markLanguageFallback(row, lang)
    const enriched = await attachEditorialMetadata(normalized, paramsId, user)
    logger?.info?.({ scope: `${config.logScope ?? config.entity}.detail`, entity: config.entity, id: paramsId, lang, timeMs: Date.now() - startedAt }, 'Entity detail fetched')
    return createResponse(enriched, null)
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
    const user = (event.context.user as AuthenticatedUser) ?? null
    const ctx: CrudContext<any> = { event, db, query: body, lang, user }

    // Enforce editorial transition and capture metadata for audit/revision
    let transitionMeta: { fromStatus: string; toStatus: string; prevSnapshot: Record<string, unknown> } | null = null
    if ((body as any).status !== undefined) {
      transitionMeta = await enforceEditorialTransition(paramsId, String((body as any).status), user, logger)
    }

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

      // B) Auto-create revision after successful status transition
      if (transitionMeta) {
        await createTransitionRevision(upsertResult.id, transitionMeta, user, logger)
      }

      if (config.onTranslationUpsert) {
        try {
          await config.onTranslationUpsert(upsertResult.id, upsertResult.lang, user?.id ?? null)
        } catch (syncErr) {
          logger?.error?.({ scope: `${config.logScope ?? config.entity}.translation_state_sync`, id: upsertResult.id, lang: upsertResult.lang, error: syncErr instanceof Error ? syncErr.message : String(syncErr) }, 'translation_state sync failed (non-blocking)')
        }
      }
      const enrichedRow = await attachEditorialMetadata(upsertResult.row, upsertResult.id, user)
      logger?.info?.({
        scope: `${config.logScope ?? config.entity}.update`,
        entity: config.entity,
        id: upsertResult.id,
        lang: upsertResult.lang,
        timeMs: Date.now() - startedAt,
      }, 'Entity updated')
      return createResponse(enrichedRow, null)
    }

    if (baseData && Object.keys(baseData).length) {
      await db
        .updateTable(config.baseTable)
        .set(baseData)
        .where(idColumn, '=', paramsId)
        .execute()
    }

    // B) Auto-create revision after successful status transition
    if (transitionMeta) {
      await createTransitionRevision(paramsId, transitionMeta, user, logger)
    }

    const row = await config.selectOne({ event, db, query: body, lang }, paramsId)
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: `${config.entity} not found` })
    }
    const enriched = await attachEditorialMetadata(markLanguageFallback(row, lang), paramsId, user)
    logger?.info?.({ scope: `${config.logScope ?? config.entity}.update`, entity: config.entity, id: paramsId, lang, timeMs: Date.now() - startedAt }, 'Entity updated')
    return createResponse(enriched, null)
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
      try {
        if (result.deletedBase && config.onBaseDelete) {
          await config.onBaseDelete(paramsId)
        } else if (result.deletedTranslation && !result.deletedBase && config.onTranslationDelete) {
          await config.onTranslationDelete(paramsId, result.lang)
        }
      } catch (syncErr) {
        logger?.error?.({ scope: `${config.logScope ?? config.entity}.translation_state_sync`, id: paramsId, lang: result.lang, error: syncErr instanceof Error ? syncErr.message : String(syncErr) }, 'translation_state sync failed on delete (non-blocking)')
      }
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
