/* eslint-disable @typescript-eslint/no-explicit-any */
// server/api/user/index.post.ts
// server/api/users/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { sql } from 'kysely'
import bcrypt from 'bcrypt'
import { safeParseOrThrow } from '../../utils/validate'
import { createResponse } from '../../utils/response'
import { userCreateSchema } from '@shared/schemas/user'
import { conflict } from '../../utils/error'
import { mergePermissions } from '../../utils/users'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const raw = await readBody(event)
    const body = safeParseOrThrow(userCreateSchema, raw)

    // Sanitize email: trim and lowercase
    const emailNormalized = body.email.trim().toLowerCase()

    const existing = await globalThis.db
      .selectFrom('users')
      .select('id')
      .where('email', '=', emailNormalized)
      .executeTakeFirst()
    if (existing) conflict('Email already in use')

    const password_hash = await bcrypt.hash(body.password, 10)

    const created = await globalThis.db
      .insertInto('users')
      .values({
        email: emailNormalized,
        username: body.username,
        password_hash,
        image: body.image ?? null,
        status: body.status ?? 'active',
      })
      .returning(['id', 'email', 'username', 'image', 'status', 'created_at', 'modified_at'])
      .executeTakeFirstOrThrow()

    // Insert roles with limit
    if (body.role_ids?.length) {
      const MAX_ROLES = 20
      if (body.role_ids.length > MAX_ROLES) {
        throw createError({ statusCode: 400, statusMessage: `Too many roles (max ${MAX_ROLES})` })
      }
      await globalThis.db
        .insertInto('user_roles')
        .values(body.role_ids.map((rid) => ({ user_id: created.id, role_id: rid })))
        .execute()
    }

    // Return enriched user
    const rows = await globalThis.db
      .selectFrom('users as u')
      .leftJoin('user_roles as ur', 'ur.user_id', 'u.id')
      .leftJoin('roles as r', 'r.id', 'ur.role_id')
      .select([
        'u.id',
        'u.username',
        'u.email',
        'u.image',
        'u.status',
        'u.created_at',
        'u.modified_at',
        sql`coalesce(json_agg(r.*) filter (where r.id is not null), '[]'::json)`.as('roles'),
      ])
      .where('u.id', '=', created.id)
      .groupBy('u.id')
      .execute()

    const u = rows[0] as any
    const rolesArr: any[] = Array.isArray(u.roles) ? u.roles : (() => {
      try { return JSON.parse(u.roles as string) } catch { return [] }
    })()
    const permissions = mergePermissions(rolesArr)

    const out = { ...u, roles: rolesArr, permissions }

    globalThis.logger?.info('User created', { id: created.id, username: created.username, timeMs: Date.now() - startedAt })
    return createResponse(out, null)
  } catch (error) {
    // Sanitize error message to prevent password exposure
    const message = error instanceof Error ? error.message : String(error)
    const sanitizedMessage = message.includes('password') ? 'Internal server error' : message
    globalThis.logger?.error('Failed to create user', {
      error: sanitizedMessage,
    })
    throw createError({ statusCode: 500, statusMessage: sanitizedMessage })
  }
})
