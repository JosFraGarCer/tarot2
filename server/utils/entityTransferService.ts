import { createError, type H3Event } from 'h3'
import type { CrudHelperOptions } from './entityCrudHelpers'
import { exportEntities, importEntities } from './entityCrudHelpers'
import { createResponse } from './response'

interface TransferOptions extends CrudHelperOptions {
  event: H3Event
  entity: string
  scope?: string
}

function resolveCount(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null
  const values = Object.values(payload)
  if (values.length === 0) return null
  const first = values[0]
  if (Array.isArray(first)) return first.length
  return null
}

export async function exportEntityData(options: TransferOptions) {
  const { event, entity, scope } = options
  const logger = event.context.logger ?? (globalThis as any).logger
  const startedAt = Date.now()

  try {
    const result = await exportEntities(options)
    const count = resolveCount(result.data)

    logger?.info?.({
      scope: scope ?? `${entity}.export`,
      entity,
      count,
      timeMs: Date.now() - startedAt,
    }, 'Entity export completed')

    return result
  } catch (error: any) {
    logger?.error?.({
      scope: scope ?? `${entity}.export`,
      entity,
      error: error?.message ?? String(error),
      timeMs: Date.now() - startedAt,
    }, 'Entity export failed')

    throw createError({
      statusCode: error?.statusCode ?? 500,
      statusMessage: error?.statusMessage ?? 'Failed to export entities',
    })
  }
}

export async function importEntityData(options: TransferOptions) {
  const { event, entity, scope } = options
  const logger = event.context.logger ?? (globalThis as any).logger
  const startedAt = Date.now()

  try {
    const result = await importEntities(options)
    const meta = {
      created: (result.data as any)?.created ?? null,
      updated: (result.data as any)?.updated ?? null,
      errors: Array.isArray((result.data as any)?.errors) ? (result.data as any).errors.length : null,
    }

    logger?.info?.({
      scope: scope ?? `${entity}.import`,
      entity,
      ...meta,
      timeMs: Date.now() - startedAt,
    }, 'Entity import completed')

    return result
  } catch (error: any) {
    logger?.error?.({
      scope: scope ?? `${entity}.import`,
      entity,
      error: error?.message ?? String(error),
      timeMs: Date.now() - startedAt,
    }, 'Entity import failed')

    throw createError({
      statusCode: error?.statusCode ?? 500,
      statusMessage: error?.statusMessage ?? 'Failed to import entities',
    })
  }
}

export function buildTransferResponse(data: unknown, meta: Record<string, unknown> = {}) {
  return createResponse(data, meta)
}
