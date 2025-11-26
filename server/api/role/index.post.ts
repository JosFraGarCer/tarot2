// server/api/role/index.post.ts
// server/api/roles/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { safeParseOrThrow } from '../../utils/validate'
import { createResponse } from '../../utils/response'
import { roleCreateSchema } from '../../schemas/role'

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  try {
    const raw = await readBody(event)
    const body = safeParseOrThrow(roleCreateSchema, raw)

    const created = await globalThis.db
      .insertInto('roles')
      .values({
        name: body.name,
        description: body.description ?? null,
        permissions: body.permissions as any,
      })
      .returning(['id', 'name', 'description', 'permissions', 'created_at'])
      .executeTakeFirstOrThrow()

    // Normalize permissions in case driver returns string
    const out = {
      ...created,
      permissions: (() => {
        const val = (created as any).permissions
        if (val && typeof val === 'string') {
          try { return JSON.parse(val) } catch { return {} }
        }
        return val ?? {}
      })(),
    }

    globalThis.logger?.info('Role created', { id: out.id, name: out.name, timeMs: Date.now() - startedAt })
    return createResponse(out, null)
  } catch (error) {
    globalThis.logger?.error('Failed to create role', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
})
