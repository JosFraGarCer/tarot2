// server/api/database/import.json.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { createResponse } from '../../utils/response'
import { importEntities } from '../../utils/entityCrudHelpers'
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

    const body = await readBody(event)
    if (!body || typeof body !== 'object') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid JSON body' })
    }

    // Import order to satisfy FKs where applicable
    const order: Array<{ key: string; args: Parameters<typeof importEntities>[0] }> = [
      { key: 'card_type', args: { event, table: 'base_card_type' } },
      { key: 'arcana', args: { event, table: 'arcana' } },
      { key: 'facet', args: { event, table: 'facet' } },
      { key: 'base_card', args: { event, table: 'base_card', translationForeignKey: 'card_id' } },
      { key: 'skill', args: { event, table: 'base_skills' } },
      { key: 'world', args: { event, table: 'world' } },
      { key: 'world_card', args: { event, table: 'world_card', translationForeignKey: 'card_id' } },
      { key: 'tag', args: { event, table: 'tags' } },
    ]

    const counts: Record<string, { created: number; updated: number }> = {}
    const errors: Array<{ entity: string; index: number; message: string }> = []

    // For each entity present in body, run importEntities
    for (const item of order) {
      if (!(item.key in body)) continue
      const res = await importEntities({ ...item.args, userId })
      const data = res.data as { created: number; updated: number; errors: Array<{ index: number; message: string }> }
      counts[item.key] = { created: data.created || 0, updated: data.updated || 0 }
      for (const e of data.errors || []) {
        errors.push({ entity: item.key, index: e.index, message: e.message })
      }
    }

    globalThis.logger?.info({ userId, counts, errors: errors.length, timeMs: Date.now() - startedAt }, 'Database import (JSON) complete')
    return createResponse({ ok: true }, { counts, errors })
  } catch (error) {
    globalThis.logger?.error({ err: error, userId, timeMs: Date.now() - startedAt }, 'Database import (JSON) failed')
    throw error
  }
})
