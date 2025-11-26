// server/api/role/[id].delete.ts
// server/api/roles/[id].delete.ts
import { defineEventHandler } from 'h3'
import { createResponse } from '../../utils/response'
import { notFound } from '../../utils/error'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const idParam = event.context.params?.id
    const id = Number(idParam)

    const deleted = await globalThis.db
      .deleteFrom('roles')
      .where('id', '=', id)
      .returning('id')
      .executeTakeFirst()

    if (!deleted) notFound('Role not found')

    globalThis.logger?.warn('Role deleted', { id, timeMs: Date.now() - startedAt })
    return createResponse({ ok: true }, null)
  } catch (error) {
    globalThis.logger?.error('Failed to delete role', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
