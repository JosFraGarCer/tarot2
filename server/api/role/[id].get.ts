// server/api/role/[id].get.ts
// server/api/roles/[id].get.ts
import { defineEventHandler } from 'h3'
import { createResponse } from '../../utils/response'
import { notFound } from '../../utils/error'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const idParam = event.context.params?.id
    const id = Number(idParam)

    const row = await globalThis.db
      .selectFrom('roles as r')
      .select(['r.id', 'r.name', 'r.description', 'r.permissions', 'r.created_at'])
      .where('r.id', '=', id)
      .executeTakeFirst()

    if (!row) notFound('Role not found')

    const out = {
      ...row,
      permissions: (() => {
        const val = (row as any).permissions
        if (val && typeof val === 'string') {
          try { return JSON.parse(val) } catch { return {} }
        }
        return val ?? {}
      })(),
    }

    globalThis.logger?.info('Role fetched', { id, timeMs: Date.now() - startedAt })
    return createResponse(out, null)
  } catch (error) {
    globalThis.logger?.error('Failed to fetch role', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
