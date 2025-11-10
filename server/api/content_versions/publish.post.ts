// server/api/content_versions/publish.post.ts
import { defineEventHandler, readBody } from 'h3'
import { sql } from 'kysely'
import { createResponse } from '../../utils/response'
import { badRequest } from '../../utils/error'
import { contentVersionCreateSchema } from '../../schemas/content-version'

/**
 * Publishes approved content revisions and links entities to a content version.
 * Body: { id?: number; version_semver?: string; notes?: string|null }
 * Returns: { versionId, totalRevisionsPublished, totalEntities }
 */
export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  const body = await readBody(event)

  // Accept either existing version id or minimal create payload
  const idMaybe = Number(body?.id)
  let versionId: number | null = Number.isFinite(idMaybe) ? idMaybe : null

  if (versionId == null) {
    // Validate create payload (version_semver required)
    const payload = contentVersionCreateSchema.pick({ version_semver: true, description: true, metadata: true, release: true }).parse({
      version_semver: body?.version_semver,
      description: body?.notes ?? null,
      metadata: {},
      release: body?.release ?? 'revision',
    })

    const inserted = await globalThis.db
      .insertInto('content_versions')
      .values({
        version_semver: payload.version_semver,
        description: payload.description ?? null,
        metadata: payload.metadata ?? {},
        release: payload.release,
      })
      .returning('id')
      .executeTakeFirst()

    if (!inserted) badRequest('Unable to create content version')
    versionId = Number(inserted.id)
  }

  // Gather approved revisions to publish
  const approved = await globalThis.db
    .selectFrom('content_revisions as cr')
    .select(['cr.id', 'cr.entity_type', 'cr.entity_id'])
    .where('cr.status', '=', sql`'approved'`)
    .execute()

  if (!approved.length) {
    return createResponse({ versionId, totalRevisionsPublished: 0, totalEntities: 0, timeMs: Date.now() - startedAt })
  }

  const entityTypesWithVersion: Record<string, true> = {
    base_card: true,
    base_card_type: true,
    world: true,
    world_card: true,
    base_skills: true,
    arcana: true,
  }

  // Publish in a transaction
  await globalThis.db.transaction().execute(async (trx) => {
    // Mark revisions as published and link to version
    await trx
      .updateTable('content_revisions')
      .set({ content_version_id: versionId as number, status: 'published' })
      .where('status', '=', 'approved')
      .execute()

    // Link entities with content_version_id where supported
    const byType: Record<string, number[]> = {}
    for (const r of approved as any[]) {
      byType[r.entity_type] ||= []
      byType[r.entity_type].push(Number(r.entity_id))
    }

    for (const [etype, ids] of Object.entries(byType)) {
      if (!entityTypesWithVersion[etype] || !ids.length) continue
      const uniq = Array.from(new Set(ids))
      await trx
        .updateTable(sql`${sql.ref(etype)}`)
        .set({ content_version_id: versionId as number })
        .where(sql`id`, 'in', uniq)
        .execute()
    }
  })

  const totalRevisionsPublished = approved.length
  const totalEntities = new Set(approved.map((r: any) => `${r.entity_type}:${r.entity_id}`)).size

  globalThis.logger?.info('Published content revisions', {
    versionId,
    totalRevisionsPublished,
    totalEntities,
    timeMs: Date.now() - startedAt,
  })

  return createResponse({ versionId, totalRevisionsPublished, totalEntities, timeMs: Date.now() - startedAt })
})
