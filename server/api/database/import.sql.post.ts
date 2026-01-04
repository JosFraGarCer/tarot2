// server/api/database/import.sql.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
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
  let rolesArr: Record<string, unknown>[] = []
  if (Array.isArray(roles)) rolesArr = roles as Record<string, unknown>[]
  else if (roles) { try { rolesArr = JSON.parse(String(roles)) } catch { /* ignore */ } }
  return mergePermissions(rolesArr as { permissions?: unknown }[])
}

function normalizeSqlInput(body: unknown): string {
  if (typeof body === 'string') return body
  if (body && typeof body === 'object') {
    if (typeof (body as { sql: unknown }).sql === 'string') return (body as { sql: string }).sql
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
    const dump = normalizeSqlInput(body)
    const statements = splitStatements(dump)

    const errors: Array<{ index: number; message: string; statement: string }> = []
    let executed = 0

    await globalThis.db.transaction().execute(async (trx) => {
      for (let i = 0; i < statements.length; i++) {
        const s = statements[i]
        try {
          await trx.executeQuery(sql.raw(s))
          executed++
        } catch (e: unknown) {
          const err = e as Error
          errors.push({ index: i, message: err?.message ?? String(err), statement: s.slice(0, 200) })
          // continue with next; not rolling back entire transaction (best-effort restore)
        }
      }
    })

    const meta = { executed, errors }
    globalThis.logger?.info({ userId, executed, errors: errors.length, timeMs: Date.now() - startedAt }, 'Database import (SQL) complete')
    return createResponse({ ok: true }, meta)
  } catch (error) {
    globalThis.logger?.error({ err: error, userId, timeMs: Date.now() - startedAt }, 'Database import (SQL) failed')
    throw error
  }
})
