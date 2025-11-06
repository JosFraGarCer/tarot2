import { defineEventHandler, createError } from 'h3'
import { createResponse } from '../../utils/response'
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
  let rolesArr: any[] = []
  if (Array.isArray(roles)) rolesArr = roles
  else if (roles) { try { rolesArr = JSON.parse(String(roles)) } catch {} }
  return mergePermissions(rolesArr)
}

function sqlEscape(val: any): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'number' && Number.isFinite(val)) return String(val)
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (val instanceof Date) return `'$${val.toISOString()}$'`
  if (typeof val === 'object') {
    const s = JSON.stringify(val)
    return `'${s.replace(/'/g, "''")}'::jsonb`
  }
  const s = String(val)
  return `'${s.replace(/'/g, "''")}'`
}

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  let userId: number | undefined
  try {
    const user = await getUserFromEvent(event)
    userId = (user as any).id
    const perms = await getUserPermissions(userId!)
    if (!(perms.canManageUsers || perms.canAccessAdmin)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // Ordered list to respect basic FK constraints
    const tables = [
      'roles',
      'users',
      'user_roles',
      'base_card_type',
      'arcana',
      'facet',
      'base_card',
      'base_skills',
      'world',
      'world_card',
      'tags',
      'base_card_type_translations',
      'arcana_translations',
      'facet_translations',
      'base_card_translations',
      'base_skills_translations',
      'world_translations',
      'world_card_translations',
      'tags_translations',
      'tag_links',
    ]

    const chunks: string[] = []
    chunks.push('-- tarot2 SQL export (basic)')
    chunks.push('BEGIN;')

    for (const table of tables) {
      const rows = await globalThis.db.selectFrom(sql`${sql.ref(table)} as t`).selectAll('t').execute()
      chunks.push(`\n-- ${table}`)
      chunks.push(`DELETE FROM ${table};`)
      if (!rows || rows.length === 0) continue
      for (const row of rows as any[]) {
        const cols = Object.keys(row)
        const values = cols.map((c) => sqlEscape(row[c]))
        chunks.push(`INSERT INTO ${table} ("${cols.join('", "')}") VALUES (${values.join(', ')});`)
      }
    }

    chunks.push('COMMIT;')
    const dump = chunks.join('\n')

    globalThis.logger?.info({ userId, size: dump.length, timeMs: Date.now() - startedAt }, 'Database export (SQL) complete')
    return createResponse({ sql: dump }, { size: dump.length })
  } catch (error) {
    globalThis.logger?.error({ err: error, userId, timeMs: Date.now() - startedAt }, 'Database export (SQL) failed')
    throw error
  }
})
