// server/api/users/[id].delete.ts
import { defineEventHandler } from 'h3'
import { notFound } from '../../utils/error'
import { createResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const id = event.context.params?.id as string

    const updated = await globalThis.db
      .updateTable('users')
      .set({ status: 'inactive' })
      .where('id', '=', id)
      .returning(['id'])
      .executeTakeFirst()

    if (!updated) notFound('User not found')

    // Remove roles as part of deactivation (optional per spec)
    await globalThis.db.deleteFrom('user_roles').where('user_id', '=', id).execute()

    globalThis.logger?.warn('User deactivated', { id, timeMs: Date.now() - startedAt })
    return createResponse({ ok: true }, null)
  } catch (error) {
    globalThis.logger?.error('Failed to deactivate user', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
