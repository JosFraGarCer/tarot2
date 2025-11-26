// server/api/user/[id].patch.ts
// server/api/users/[id].patch.ts
// PATCH: update partial fields for User entity
import { defineEventHandler, readBody } from 'h3'
import bcrypt from 'bcrypt'
import { safeParseOrThrow } from '../../utils/validate'
import { createResponse } from '../../utils/response'
import { notFound } from '../../utils/error'
import { userUpdateSchema } from '../../schemas/user'
import { mergePermissions } from '../../utils/users'
import { sql } from 'kysely'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const id = event.context.params?.id as string
    const raw = await readBody(event)
    const body = safeParseOrThrow(userUpdateSchema, raw)

    const result = await globalThis.db.transaction().execute(async (trx) => {
      // Build update payload
      const update: Record<string, unknown> = {}
      if (body.email !== undefined) update.email = body.email
      if (body.username !== undefined) update.username = body.username
      if (body.image !== undefined) update.image = body.image ?? null
      if (body.status !== undefined) update.status = body.status
      if (body.is_active !== undefined && body.status === undefined) {
        update.status = body.is_active ? 'active' : 'inactive'
      }
      if (body.password) update.password_hash = await bcrypt.hash(body.password, 10)

      if (Object.keys(update).length > 0) {
        const upd = await trx
          .updateTable('users')
          .set(update)
          .where('id', '=', id)
          .returning(['id'])
          .executeTakeFirst()
        if (!upd) return null
      } else {
        // Ensure the user exists
        const exists = await trx.selectFrom('users').select('id').where('id', '=', id).executeTakeFirst()
        if (!exists) return null
      }

      if (Array.isArray(body.role_ids)) {
        // Replace roles
        await trx.deleteFrom('user_roles').where('user_id', '=', id).execute()
        if (body.role_ids.length > 0) {
          await trx
            .insertInto('user_roles')
            .values(body.role_ids.map((rid) => ({ user_id: Number(id), role_id: rid })))
            .execute()
        }
      }

      // Return enriched row
      const row = await trx
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
        .where('u.id', '=', id)
        .groupBy('u.id')
        .executeTakeFirst()

      return row
    })

    if (!result) notFound('User not found')

    const rolesArr: any[] = Array.isArray((result as any).roles)
      ? ((result as any).roles as any[])
      : (() => {
          try {
            return JSON.parse((result as any).roles as string)
          } catch {
            return []
          }
        })()
    const permissions = mergePermissions(rolesArr)

    const user = { ...(result as any), roles: rolesArr, permissions }

    globalThis.logger?.info('User updated', { id, username: (result as any).username, timeMs: Date.now() - startedAt })
    return createResponse(user, null)
  } catch (error) {
    globalThis.logger?.error('Failed to update user', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
