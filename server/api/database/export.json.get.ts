// server/api/database/export.json.get.ts
import { defineEventHandler, createError } from 'h3'
import { createResponse } from '../../utils/response'
import { exportEntities } from '../../utils/entityCrudHelpers'
import { getUserFromEvent } from '../../plugins/auth'
import { mergePermissions } from '../../utils/users'
import { sql } from 'kysely'

async function getUserPermissions(userId: number) {
  const row = await globalThis.db
    .selectFrom('user_roles as ur')
    .leftJoin('roles as r', 'r.id', 'ur.role_id')
    .select(sql`coalesce(json_agg(r.*) filter (where r.id is not null), '[]'::json)`.as('roles'))
    .where('ur.user_id', '=', userId)
    .groupBy('ur.user_id')
    .executeTakeFirst()
  const roles = row?.roles
  let rolesArr: Record<string, unknown>[] = []
  if (Array.isArray(roles)) rolesArr = roles as Record<string, unknown>[]
  else if (roles) { try { rolesArr = JSON.parse(String(roles)) } catch { /* ignore */ } }
  return mergePermissions(rolesArr as { permissions?: unknown }[])
}

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  let userId: number | undefined
  try {
    const user = await getUserFromEvent(event)
    userId = (user as { id: number }).id
    const perms = await getUserPermissions(userId!)
    if (!(perms.canManageUsers || perms.canAccessAdmin)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // Aggregate exports for all entities
    const data: Record<string, unknown> = {}
    const counts: Record<string, number> = {}

    const collect = async (key: string, args: Parameters<typeof exportEntities>[0]) => {
      const res = await exportEntities(args)
      const tableName = Object.keys(res.data || {})[0]
      const arr = (res.data as Record<string, unknown>)[tableName] || []
      data[key] = arr
      counts[key] = Array.isArray(arr) ? arr.length : 0
    }

    await collect('world', { event, table: 'world' })
    await collect('world_card', { event, table: 'world_card', translationForeignKey: 'card_id' })
    await collect('arcana', { event, table: 'arcana' })
    await collect('base_card', { event, table: 'base_card', translationForeignKey: 'card_id' })
    await collect('card_type', { event, table: 'base_card_type', translationForeignKey: 'card_type_id' })
    await collect('skill', { event, table: 'base_skills' })
    await collect('facet', { event, table: 'facet' })
    await collect('tag', { event, table: 'tags' })

    globalThis.logger?.info({ userId, counts, timeMs: Date.now() - startedAt }, 'Database export (JSON) complete')
    return createResponse(data, { counts })
  } catch (error) {
    globalThis.logger?.error({ err: error, userId, timeMs: Date.now() - startedAt }, 'Database export (JSON) failed')
    throw error
  }
})
