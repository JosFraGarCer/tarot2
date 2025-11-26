// server/api/user/[id].delete.ts
// server/api/users/[id].delete.ts
import { defineEventHandler } from 'h3'
import { notFound } from '../../utils/error'
import { createResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const id = event.context.params?.id as string

    await globalThis.db.deleteFrom('user_roles').where('user_id', '=', id).execute()

    const deleted = await globalThis.db
      .deleteFrom('users')
      .where('id', '=', id)
      .returning('id')
      .executeTakeFirst()

    if (!deleted) notFound('User not found')

    globalThis.logger?.warn('User deleted', { id, timeMs: Date.now() - startedAt })
    return createResponse({ ok: true }, null)
  } catch (error) {
    globalThis.logger?.error('Failed to deactivate user', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
