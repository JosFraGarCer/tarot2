// server/api/database/import.sql.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { createResponse } from '../../utils/response'
import { getUserFromEvent } from '../../plugins/auth'
import { mergePermissions } from '../../utils/users'
import { sql } from 'kysely'

interface RoleWithPermissions {
  permissions?: Record<string, boolean | number | null | undefined>
}

const ALLOWED_SQL_TABLES = new Set([
  'arcana',
  'arcana_translations',
  'base_card',
  'base_card_translations',
  'base_card_type',
  'base_card_type_translations',
  'facet',
  'facet_translations',
  'world',
  'world_translations',
  'world_card',
  'world_card_translations',
  'base_skills',
  'base_skills_translations',
  'tags',
  'tags_translations',
  'tag_links',
  'content_versions',
  'content_revisions',
  'content_feedback',
  'editorial_state',
  'translation_state',
])

function isSqlImportEnabled(): boolean {
  const raw = process.env.ALLOW_SQL_IMPORT
  return typeof raw === 'string' && ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
}

async function getUserPermissions(userId: number) {
  const row = await globalThis.db
    .selectFrom('user_roles as ur')
    .leftJoin('roles as r', 'r.id', 'ur.role_id')
    .select(sql`coalesce(json_agg(r.*) filter (where r.id is not null), '[]'::json)`.as('roles'))
    .where('ur.user_id', '=', userId)
    .groupBy('ur.user_id')
    .executeTakeFirst()

  const rolesValue = row?.roles
  let rolesArr: RoleWithPermissions[] = []

  if (Array.isArray(rolesValue)) {
    rolesArr = rolesValue as RoleWithPermissions[]
  } else if (rolesValue) {
    try {
      const parsed = JSON.parse(String(rolesValue))
      if (Array.isArray(parsed)) {
        rolesArr = parsed as RoleWithPermissions[]
      }
    } catch {
      rolesArr = []
    }
  }

  return mergePermissions(rolesArr)
}

function extractUserId(user: unknown): number {
  if (typeof user === 'object' && user !== null && 'id' in user) {
    const id = (user as { id?: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) {
      return id
    }
  }

  throw createError({ statusCode: 401, statusMessage: 'Invalid authenticated user payload' })
}

function normalizeSqlInput(body: unknown): string {
  if (typeof body === 'string') return body
  if (body && typeof body === 'object') {
    const bodyWithSql = body as { sql?: unknown }
    if (typeof bodyWithSql.sql === 'string') return bodyWithSql.sql
  }
  throw createError({ statusCode: 400, statusMessage: 'Invalid body: expected text or { sql: string }' })
}

function splitStatements(dump: string): string[] {
  // Simple splitter for our own generated dump (no semicolons inside JSON strings)
  const lines = dump.split(/\r?\n/)
  const filtered = lines.filter((l) => !/^\s*--/.test(l))
  const text = filtered.join('\n')
  const parts = text.split(';')
  const stmts = parts
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^begin$/i.test(s) && !/^commit$/i.test(s))
  return stmts
}

function extractTableName(stmt: string): string | null {
  const normalized = stmt.trim().replace(/\s+/g, ' ')
  const insertMatch = normalized.match(/^insert\s+into\s+"?([a-z0-9_]+)"?/i)
  if (insertMatch?.[1]) return insertMatch[1].toLowerCase()

  const deleteMatch = normalized.match(/^delete\s+from\s+"?([a-z0-9_]+)"?/i)
  if (deleteMatch?.[1]) return deleteMatch[1].toLowerCase()

  return null
}

function assertWhitelistedStatement(stmt: string) {
  const lowered = stmt.toLowerCase().trim()
  if (!lowered) return

  if (!lowered.startsWith('insert into') && !lowered.startsWith('delete from')) {
    throw createError({ statusCode: 400, statusMessage: 'Only INSERT INTO and DELETE FROM statements are allowed' })
  }

  if (/\b(drop|alter|create|grant|revoke|truncate)\b/i.test(lowered)) {
    throw createError({ statusCode: 400, statusMessage: 'Disallowed SQL keyword in import payload' })
  }

  const tableName = extractTableName(stmt)
  if (!tableName || !ALLOWED_SQL_TABLES.has(tableName)) {
    throw createError({ statusCode: 400, statusMessage: `Statement targets a non-whitelisted table: ${tableName ?? 'unknown'}` })
  }
}

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  let userId: number | undefined
  try {
    if (process.env.NODE_ENV === 'production' && !isSqlImportEnabled()) {
      throw createError({ statusCode: 403, statusMessage: 'SQL import is disabled in production' })
    }

    const user = await getUserFromEvent(event)
    userId = extractUserId(user)
    const perms = await getUserPermissions(userId!)
    if (!(perms.canManageUsers || perms.canAccessAdmin)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    const body = await readBody(event)
    const dump = normalizeSqlInput(body)
    const statements = splitStatements(dump)

    let executed = 0

    await globalThis.db.transaction().execute(async (trx) => {
      for (let i = 0; i < statements.length; i++) {
        const s = statements[i]
        assertWhitelistedStatement(s)
        await trx.executeQuery(sql.raw(s))
        executed++
      }
    })

    const meta = { executed }
    globalThis.logger?.info({ userId, executed, timeMs: Date.now() - startedAt }, 'Database import (SQL) complete')
    return createResponse({ ok: true }, meta)
  } catch (error) {
    globalThis.logger?.error({ err: error, userId, timeMs: Date.now() - startedAt }, 'Database import (SQL) failed')
    throw error
  }
})
