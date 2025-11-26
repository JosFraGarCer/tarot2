// server/api/role/[id].patch.ts
// server/api/roles/[id].patch.ts
// PATCH: update partial fields for Role entity
import { defineEventHandler, readBody } from 'h3'
import { safeParseOrThrow } from '../../utils/validate'
import { createResponse } from '../../utils/response'
import { notFound } from '../../utils/error'
import { roleUpdateSchema } from '../../schemas/role'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const idParam = event.context.params?.id
    const id = Number(idParam)

    const raw = await readBody(event)
    const body = safeParseOrThrow(roleUpdateSchema, raw)

    const patch: Record<string, unknown> = {}
    if (body.name !== undefined) patch.name = body.name
    if (body.description !== undefined) patch.description = body.description ?? null
    if (body.permissions !== undefined) patch.permissions = body.permissions as any

    const updated = await globalThis.db
      .updateTable('roles')
      .set(patch)
      .where('id', '=', id)
      .returning(['id', 'name', 'description', 'permissions', 'created_at'])
      .executeTakeFirst()

    if (!updated) notFound('Role not found')

    const out = {
      ...updated,
      permissions: (() => {
        const val = (updated as any).permissions
        if (val && typeof val === 'string') {
          try { return JSON.parse(val) } catch { return {} }
        }
        return val ?? {}
      })(),
    }

    globalThis.logger?.info('Role updated', { id, name: out.name, timeMs: Date.now() - startedAt })
    return createResponse(out, null)
  } catch (error) {
    globalThis.logger?.error('Failed to update role', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
