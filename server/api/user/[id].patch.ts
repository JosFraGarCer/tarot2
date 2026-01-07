import { defineEventHandler, readValidatedBody } from 'h3'
import bcrypt from 'bcrypt'
import { createResponse } from '../../utils/response'
import { notFound } from '../../utils/error'
import { userUpdateSchema } from '../../schemas/user'
import { mergePermissions } from '../../utils/users'
import { sql } from 'kysely'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const id = event.context.params?.id as string
    const body = await readValidatedBody(event, userUpdateSchema.parse)

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
          .set(update as any)
          .where('id', '=', id as any)
          .returning(['id'])
          .executeTakeFirst()
        if (!upd) return null
      } else {
        // Ensure the user exists
        const exists = await trx.selectFrom('users').select('id').where('id', '=', id as any).executeTakeFirst()
        if (!exists) return null
      }

      if (Array.isArray(body.role_ids)) {
        // Replace roles
        await trx.deleteFrom('user_roles').where('user_id', '=', id as any).execute()
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
        .where('u.id', '=', id as any)
        .groupBy('u.id')
        .executeTakeFirst()

      return row
    })

    if (!result) notFound('User not found')

    const userResult = result as {
      id: number
      username: string
      email: string
      image: string | null
      status: string
      created_at: Date | string
      modified_at: Date | string
      roles: unknown
    }

    const rolesArr: Record<string, unknown>[] = Array.isArray(userResult.roles)
      ? (userResult.roles as Record<string, unknown>[])
      : (() => {
          try {
            return JSON.parse(userResult.roles as string)
          } catch {
            return []
          }
        })()
    const permissions = mergePermissions(rolesArr as { permissions?: unknown }[])

    const user = { ...userResult, roles: rolesArr, permissions }

    globalThis.logger?.info('User updated', { id, username: userResult.username, timeMs: Date.now() - startedAt })
    return createResponse(user, null)
  } catch (error) {
    globalThis.logger?.error('Failed to update user', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
