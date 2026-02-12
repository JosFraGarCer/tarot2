// server/api/world/[id]/version-context.get.ts
import { defineEventHandler, createError, getRouterParam } from 'h3'
import type { Kysely } from 'kysely'
import type { DB } from '../../../database/types'
import { createResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  const db = globalThis.db as Kysely<DB>
  if (!db) throw createError({ statusCode: 500, statusMessage: 'Database not available' })

  const idParam = getRouterParam(event, 'id')
  const worldId = Number(idParam)
  if (!idParam || !Number.isFinite(worldId) || worldId < 1) {
    throw createError({ statusCode: 400, statusMessage: `Invalid world id: ${String(idParam)}` })
  }

  // Verify world exists
  const world = await db
    .selectFrom('world')
    .select('id')
    .where('id', '=', worldId)
    .executeTakeFirst()

  if (!world) {
    throw createError({ statusCode: 404, statusMessage: 'World not found' })
  }

  // Get pin (may not exist — world has no pinned version)
  const pin = await db
    .selectFrom('world_content_pins')
    .selectAll()
    .where('world_id', '=', worldId)
    .executeTakeFirst()

  if (!pin) {
    return createResponse({
      world_id: worldId,
      content_version_id: null,
      pinned_at: null,
      pinned_by: null,
      version: null,
    })
  }

  // Get version metadata
  const version = await db
    .selectFrom('content_versions')
    .select(['id', 'version_semver', 'release', 'description', 'created_at'])
    .where('id', '=', pin.content_version_id)
    .executeTakeFirst()

  return createResponse({
    world_id: worldId,
    content_version_id: pin.content_version_id,
    pinned_at: String(pin.pinned_at),
    pinned_by: pin.pinned_by,
    version: version
      ? {
          id: version.id,
          version_semver: version.version_semver,
          release: version.release,
          description: version.description,
          created_at: String(version.created_at),
        }
      : null,
  })
})
