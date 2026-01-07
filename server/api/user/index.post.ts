import { defineEventHandler, readValidatedBody } from 'h3'
import { sql } from 'kysely'
import bcrypt from 'bcrypt'
import { createResponse } from '../../utils/response'
import { userCreateSchema } from '../../schemas/user'
import { conflict } from '../../utils/error'
import { mergePermissions } from '../../utils/users'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const body = await readValidatedBody(event, userCreateSchema.parse)

    const existing = await globalThis.db
      .selectFrom('users')
      .select('id')
      .where('email', '=', body.email)
      .executeTakeFirst()
    if (existing) conflict('Email already in use')

    const password_hash = await bcrypt.hash(body.password, 10)

    const created = await globalThis.db
      .insertInto('users')
      .values({
        email: body.email,
        username: body.username,
        password_hash,
        image: body.image ?? null,
        status: (body.status ?? 'active') as any,
      })
      .returning(['id', 'email', 'username', 'image', 'status', 'created_at', 'modified_at'])
      .executeTakeFirstOrThrow()

    // Insert roles
    if (body.role_ids?.length) {
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
      .where('u.id', '=', created.id as any)
      .groupBy('u.id')
      .execute()

    const u = rows[0] as {
      id: number
      username: string
      email: string
      image: string | null
      status: string
      created_at: Date | string
      modified_at: Date | string
      roles: unknown
    }
    const rolesArr: Record<string, unknown>[] = Array.isArray(u.roles)
      ? u.roles as Record<string, unknown>[]
      : (() => {
          try { return JSON.parse(u.roles as string) } catch { return [] }
        })()
    const permissions = mergePermissions(rolesArr as { permissions?: unknown }[])

    const out = { ...u, roles: rolesArr, permissions }

    globalThis.logger?.info('User created', { id: created.id, username: created.username, timeMs: Date.now() - startedAt })
    return createResponse(out, null)
  } catch (error) {
    globalThis.logger?.error('Failed to create user', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
