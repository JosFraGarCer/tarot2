// server/api/content_versions/publish.post.ts
import { defineEventHandler, readBody } from 'h3'
import { sql } from 'kysely'
import { safeParseOrThrow } from '../../utils/validate'
import { createResponse } from '../../utils/response'
import { badRequest, forbidden, notFound } from '../../utils/error'
import { contentVersionPublishSchema } from '@shared/schemas/content-version'
import { enforceRateLimit } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  const logger = event.context.logger ?? globalThis.logger
  const requestId = event.context.requestId ?? null

  logger?.info?.({ scope: 'content_versions.publish.start', requestId }, 'Content version publish started')

  const user = (event.context as any).user
  const permissions = user?.permissions ?? {}
  if (!permissions.canPublish) forbidden('Permission required to publish content versions')

  // Fallback limiter in case middleware is bypassed (e.g. tests)
  enforceRateLimit(event, {
    scope: 'content_versions.publish.rate_limit',
    identifier: `${event.node.req.method}:content_versions.publish`,
    max: 10,
    windowMs: 60_000,
  })

  const payload = safeParseOrThrow(contentVersionPublishSchema, await readBody(event))

  const publishedAt = new Date().toISOString()
  const userId = user?.id ?? null

  const db = globalThis.db
  let createdVersion = false
  let versionId = payload.version_id ?? null
  let versionSemver: string | null = null

  const transactionResult = await db.transaction().execute(async (trx) => {
    let metadataPatch: Record<string, any> = {}

    if (versionId == null) {
      const release = payload.release ?? 'revision'

      if (!payload.version_semver) {
        badRequest('version_semver is required when version_id is not provided')
      }

      const duplicate = await trx
        .selectFrom('content_versions')
        .select('id')
        .where('version_semver', '=', payload.version_semver)
        .executeTakeFirst()
      if (duplicate) badRequest('version_semver already exists')

      const inserted = await trx
        .insertInto('content_versions')
        .values({
          version_semver: payload.version_semver,
          description: payload.description ?? null,
          metadata: { ...(payload.metadata ?? {}), published_at: publishedAt, published_by: userId },
          release,
          created_by: userId,
        })
        .returning(['id', 'version_semver'])
        .executeTakeFirst()

      if (!inserted) badRequest('Unable to create content version')
      versionId = Number(inserted.id)
      versionSemver = inserted.version_semver
      createdVersion = true
    } else {
      const existing = await trx
        .selectFrom('content_versions')
        .select(['id', 'version_semver', 'metadata'])
        .where('id', '=', versionId)
        .executeTakeFirst()

      if (!existing) notFound('Content version not found')

      versionSemver = existing.version_semver

      const updatePatch: Record<string, any> = {}

      if (payload.version_semver && payload.version_semver !== existing.version_semver) {
        const duplicate = await trx
          .selectFrom('content_versions')
          .select('id')
          .where('version_semver', '=', payload.version_semver)
          .where('id', '!=', versionId)
          .executeTakeFirst()
        if (duplicate) badRequest('version_semver already exists')
        updatePatch.version_semver = payload.version_semver
        versionSemver = payload.version_semver
      }

      if (payload.description !== undefined) updatePatch.description = payload.description ?? null
      if (payload.release !== undefined) updatePatch.release = payload.release

      const baseMetadata = (() => {
        const meta = existing.metadata
        if (!meta) return {}
        if (typeof meta === 'object') return meta as Record<string, any>
        try {
          return JSON.parse(String(meta))
        } catch {
          return {}
        }
      })()

      metadataPatch = {
        ...baseMetadata,
        ...(payload.metadata ?? {}),
        published_at: publishedAt,
        published_by: userId,
      }
      updatePatch.metadata = metadataPatch

      if (Object.keys(updatePatch).length) {
        await trx
          .updateTable('content_versions')
          .set(updatePatch)
          .where('id', '=', versionId)
          .execute()
      }
    }

    const approved = await trx
      .selectFrom('content_revisions as cr')
      .select(['cr.id', 'cr.entity_type', 'cr.entity_id'])
      .where('cr.status', '=', sql`'approved'`)
      .execute()

    if (!approved.length) {
      return {
        approved,
      }
    }

    await trx
      .updateTable('content_revisions')
      .set({ content_version_id: versionId as number, status: 'published' })
      .where('status', '=', 'approved')
      .execute()

    const entityTypesWithVersion: Record<string, true> = {
      base_card: true,
      base_card_type: true,
      world: true,
      world_card: true,
      base_skills: true,
      arcana: true,
    }

    const byType: Record<string, number[]> = {}
    for (const revision of approved as any[]) {
      byType[revision.entity_type] ||= []
      byType[revision.entity_type].push(Number(revision.entity_id))
    }

    for (const [table, ids] of Object.entries(byType)) {
      if (!entityTypesWithVersion[table] || !ids.length) continue
      const uniqueIds = Array.from(new Set(ids))
      await trx
        .updateTable(sql`${sql.ref(table)}`)
        .set({ content_version_id: versionId as number })
        .where(sql`id`, 'in', uniqueIds)
        .execute()
    }

    return { approved }
  })

  const approved = transactionResult.approved as Array<{ id: number; entity_type: string; entity_id: number }>
  const totalRevisionsPublished = approved?.length ?? 0
  const totalEntities = approved?.length
    ? new Set(approved.map((item) => `${item.entity_type}:${item.entity_id}`)).size
    : 0

  logger?.info?.(
    {
      scope: 'content_versions.publish.end',
      requestId,
      version_id: versionId,
      version_semver: versionSemver,
      published_by: userId,
      published_at: publishedAt,
      created_new_version: createdVersion,
      totalRevisionsPublished,
      totalEntities,
      timeMs: Date.now() - startedAt,
    },
    'Content version publish completed',
  )

  return createResponse({
    version_id: versionId,
    version_semver: versionSemver,
    published_by: userId,
    published_at: publishedAt,
    created_new_version: createdVersion,
    totalRevisionsPublished,
    totalEntities,
  })
})
