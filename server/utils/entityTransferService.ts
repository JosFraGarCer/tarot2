// server/utils/entityTransferService.ts
import { createError, type H3Event } from 'h3'
import type { CrudHelperOptions } from './entityCrudHelpers'
import { exportEntities, importEntities } from './entityCrudHelpers'
import { createResponse } from './response'

interface TransferOptions extends CrudHelperOptions {
  event: H3Event
  entity: string
  scope?: string
}

interface TransferLogger {
  info?: (obj: Record<string, unknown>, msg?: string) => void
  error?: (obj: Record<string, unknown>, msg?: string) => void
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  return value as Record<string, unknown>
}

function getTransferLogger(event: H3Event): TransferLogger | undefined {
  return (event.context.logger as TransferLogger | undefined) ?? (globalThis as { logger?: TransferLogger }).logger
}

function readNumberField(payload: unknown, key: string): number | null {
  const record = asRecord(payload)
  if (!record) return null
  const value = record[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readArrayLengthField(payload: unknown, key: string): number | null {
  const record = asRecord(payload)
  if (!record) return null
  const value = record[key]
  return Array.isArray(value) ? value.length : null
}

function normalizeError(error: unknown): { message: string; statusCode?: number; statusMessage?: string } {
  if (error instanceof Error) {
    const known = error as Error & { statusCode?: number; statusMessage?: string }
    return {
      message: known.message,
      statusCode: known.statusCode,
      statusMessage: known.statusMessage,
    }
  }

  const record = asRecord(error)
  const message = typeof record?.message === 'string' ? record.message : String(error)
  const statusCode = typeof record?.statusCode === 'number' ? record.statusCode : undefined
  const statusMessage = typeof record?.statusMessage === 'string' ? record.statusMessage : undefined

  return { message, statusCode, statusMessage }
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
  const logger = getTransferLogger(event)
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
  } catch (error: unknown) {
    const errorInfo = normalizeError(error)

    logger?.error?.({
      scope: scope ?? `${entity}.export`,
      entity,
      error: errorInfo.message,
      timeMs: Date.now() - startedAt,
    }, 'Entity export failed')

    throw createError({
      statusCode: errorInfo.statusCode ?? (errorInfo.message.includes('not found') ? 404 : 500),
      statusMessage: errorInfo.statusMessage ?? 'Failed to export entities',
    })
  }
}

export async function importEntityData(options: TransferOptions) {
  const { event, entity, scope } = options
  const logger = getTransferLogger(event)
  const startedAt = Date.now()

  try {
    const result = await importEntities(options)
    const meta = {
      created: readNumberField(result.data, 'created'),
      updated: readNumberField(result.data, 'updated'),
      errors: readArrayLengthField(result.data, 'errors'),
    }

    logger?.info?.({
      scope: scope ?? `${entity}.import`,
      entity,
      ...meta,
      timeMs: Date.now() - startedAt,
    }, 'Entity import completed')

    return result
  } catch (error: unknown) {
    const errorInfo = normalizeError(error)

    logger?.error?.({
      scope: scope ?? `${entity}.import`,
      entity,
      error: errorInfo.message,
      timeMs: Date.now() - startedAt,
    }, 'Entity import failed')

    throw createError({
      statusCode: errorInfo.statusCode ?? 500,
      statusMessage: errorInfo.statusMessage ?? 'Failed to import entities',
    })
  }
}

export function buildTransferResponse(data: unknown, meta: Record<string, unknown> = {}) {
  return createResponse(data, meta)
}
