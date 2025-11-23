// app/composables/common/useBatchMutation.ts
/**
 * SSR-safe helper for executing backend batch mutation endpoints.
 * Handles optimistic state, toasts, logging, and Nuxt data refresh.
 */
import { computed, ref, toValue, readonly, type MaybeRefOrGetter, type Ref, type ComputedRef } from 'vue'
import { useNuxtApp, useToast, refreshNuxtData } from '#imports'
import { useApiFetch } from '@/utils/fetcher'
import type { EntityCapabilities } from '~/composables/common/useEntityCapabilities'

export interface BatchMutationError {
  message: string
  statusCode?: number
  details?: any
  raw?: any
}

export interface BatchMutationResult<TResult = any> {
  success?: boolean
  data?: TResult
  meta?: Record<string, any> | null
  [key: string]: any
}

export interface RunBatchInput<TPayload = Record<string, any>> {
  ids: Array<string | number>
  payload?: TPayload | null
  method?: string
  headers?: Record<string, string>
}

export interface UseBatchMutationOptions<TPayload = Record<string, any>, TResult = any> {
  kind: string
  endpoint: string
  method?: string
  transformPayload?: (input: { ids: Array<string | number>; payload?: TPayload | null }) => Record<string, any>
  onSuccess?: (result: TResult, context: BatchMutationContext<TPayload, TResult>) => void | Promise<void>
  onError?: (error: BatchMutationError, context: BatchMutationContext<TPayload, TResult>) => void | Promise<void>
  autoToast?: boolean
  toast?: ReturnType<typeof useToast> | null
  headers?: Record<string, string>
  refreshKeys?: Array<MaybeRefOrGetter<string | null | undefined>>
  refreshHandlers?: Array<() => Promise<void> | void>
  label?: string
  capabilities?: MaybeRefOrGetter<Partial<EntityCapabilities> | null | undefined>
  capabilityKey?: keyof EntityCapabilities
  loggerScope?: string
}

export interface BatchMutationContext<TPayload, TResult> {
  ids: Array<string | number>
  payload: TPayload | null
  options: UseBatchMutationOptions<TPayload, TResult>
}

export interface BatchMutationController<TPayload, TResult> {
  runBatch: (input: RunBatchInput<TPayload>) => Promise<TResult | null>
  loading: Readonly<Ref<boolean>>
  lastError: Readonly<Ref<BatchMutationError | null>>
  lastResult: Readonly<Ref<TResult | null>>
  canRun: Readonly<ComputedRef<boolean>>
  reset: () => void
}

const DEFAULT_METHOD = 'PATCH'
const DEFAULT_CAPABILITY_KEY: keyof EntityCapabilities = 'actionsBatch'

export function useBatchMutation<TPayload = Record<string, any>, TResult = any>(
  optionsInput: MaybeRefOrGetter<UseBatchMutationOptions<TPayload, TResult> | null | undefined>,
): BatchMutationController<TPayload, TResult> {
  const loading = ref(false)
  const lastError = ref<BatchMutationError | null>(null)
  const lastResult = ref<TResult | null>(null)

  const apiFetch = useApiFetch
  const nuxtApp = useNuxtApp()
  const globalToast = useToast?.()

  const resolvedOptions = computed(() => toValue(optionsInput) ?? null)

  const capabilityState = computed<Partial<EntityCapabilities> | null>(() => {
    const opts = resolvedOptions.value
    if (!opts?.capabilities) return null
    return toValue(opts.capabilities) ?? null
  })

  const canRun = computed(() => {
    const opts = resolvedOptions.value
    if (!opts) return false
    if (!opts.kind || !opts.endpoint) return false
    const capabilityKey = opts.capabilityKey ?? DEFAULT_CAPABILITY_KEY
    const caps = capabilityState.value
    if (!caps) return true
    const capability = caps[capabilityKey]
    return capability === undefined ? true : capability !== false
  })

  function reset() {
    lastError.value = null
    lastResult.value = null
    loading.value = false
  }

  async function runBatch(input: RunBatchInput<TPayload>): Promise<TResult | null> {
    const opts = resolvedOptions.value
    if (!opts) {
      emitWarning('useBatchMutation invoked without options')
      return null
    }

    if (!canRun.value) {
      emitWarning('Batch mutation disabled by capabilities', opts)
      return null
    }

    const ids = Array.isArray(input?.ids) ? Array.from(new Set(input.ids)).filter(isValidId) : []
    if (!ids.length) {
      const error: BatchMutationError = {
        message: 'No entities selected for batch action',
        statusCode: 400,
        details: { ids: input?.ids },
      }
      lastError.value = error
      handleImmediateError(opts, error, input.payload ?? null)
      return null
    }

    const method = (input.method ?? opts.method ?? DEFAULT_METHOD).toUpperCase()
    const headers = { ...(opts.headers ?? {}), ...(input.headers ?? {}) }

    const payloadBody = opts.transformPayload
      ? opts.transformPayload({ ids, payload: input.payload ?? null })
      : buildDefaultPayload(ids, input.payload)

    const toast = opts.toast ?? globalToast ?? null
    const actionLabel = opts.label ?? opts.kind ?? 'Batch action'

    loading.value = true
    lastError.value = null
    lastResult.value = null

    const logger = nuxtApp?.$logger?.child?.({ scope: opts.loggerScope ?? 'batch', kind: opts.kind }) ?? nuxtApp?.$logger
    logger?.info?.('batch.start', { kind: opts.kind, endpoint: opts.endpoint, ids: ids.length })

    try {
      const response = await apiFetch<BatchMutationResult<TResult> | TResult>(opts.endpoint, {
        method,
        body: payloadBody,
        headers,
      })

      const result = unwrapResult<TResult>(response)
      lastResult.value = result

      await triggerRefresh(opts)

      if (opts.autoToast !== false) {
        toast?.add?.({
          title: actionLabel,
          description: `${ids.length} ${ids.length === 1 ? 'item' : 'items'} updated successfully`,
          color: 'success',
        })
      }

      const context: BatchMutationContext<TPayload, TResult> = { ids, payload: input.payload ?? null, options: opts }
      if (typeof opts.onSuccess === 'function') {
        await opts.onSuccess(result, context)
      }

      logger?.info?.('batch.success', { kind: opts.kind, endpoint: opts.endpoint, ids: ids.length })
      return result
    } catch (err: any) {
      const normalizedError = normalizeError(err)
      lastError.value = normalizedError
      lastResult.value = null

      const context: BatchMutationContext<TPayload, TResult> = { ids, payload: input.payload ?? null, options: opts }
      if (typeof opts.onError === 'function') {
        await opts.onError(normalizedError, context)
      }

      if (opts.autoToast !== false) {
        toast?.add?.({
          title: actionLabel,
          description: normalizedError.message,
          color: 'error',
        })
      }

      logger?.error?.('batch.error', {
        kind: opts.kind,
        endpoint: opts.endpoint,
        ids: ids.length,
        error: normalizedError,
      })

      return null
    } finally {
      loading.value = false
    }
  }

  return {
    runBatch,
    loading: readonly(loading),
    lastError: readonly(lastError),
    lastResult: readonly(lastResult),
    canRun: readonly(canRun),
    reset,
  }
}

function buildDefaultPayload(ids: Array<string | number>, payload?: Record<string, any> | null) {
  if (payload && typeof payload === 'object') {
    return { ids, ...payload }
  }
  return { ids }
}

function isValidId(value: unknown): value is string | number {
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'string') return value.trim().length > 0
  return false
}

async function triggerRefresh<TPayload, TResult>(options: UseBatchMutationOptions<TPayload, TResult>) {
  const promises: Array<Promise<void>> = []

  if (Array.isArray(options.refreshKeys)) {
    for (const keyRef of options.refreshKeys) {
      const key = toValue(keyRef)
      if (typeof key === 'string' && key.length) {
        promises.push(refreshNuxtData(key).then(() => undefined))
      }
    }
  }

  if (Array.isArray(options.refreshHandlers)) {
    for (const handler of options.refreshHandlers) {
      if (typeof handler === 'function') {
        const result = handler()
        if (result && typeof (result as Promise<void>).then === 'function') {
          promises.push((result as Promise<void>).catch(() => undefined))
        }
      }
    }
  }

  if (promises.length) {
    await Promise.allSettled(promises)
  }
}

function unwrapResult<TResult>(response: BatchMutationResult<TResult> | TResult): TResult {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as BatchMutationResult<TResult>).data as TResult
  }
  return response as TResult
}

function normalizeError(error: any): BatchMutationError {
  if (!error) {
    return { message: 'Unknown error occurred', raw: error }
  }

  if (typeof error === 'string') {
    return { message: error }
  }

  if (error instanceof Error) {
    return { message: error.message, raw: error }
  }

  const message = error?.data?.message || error?.message || error?.statusMessage || 'Batch action failed'
  const statusCode = error?.statusCode || error?.status || error?.response?.status

  return {
    message,
    statusCode,
    details: error?.data ?? error?.response?.data ?? error,
    raw: error,
  }
}

function handleImmediateError<TPayload, TResult>(
  options: UseBatchMutationOptions<TPayload, TResult>,
  error: BatchMutationError,
  payload: TPayload | null,
) {
  const toast = options.toast ?? useToast?.()
  if (options.autoToast !== false) {
    toast?.add?.({
      title: options.label ?? options.kind ?? 'Batch action',
      description: error.message,
      color: 'error',
    })
  }
  options.onError?.(error, { ids: [], payload, options })
}

function emitWarning(message: string, meta?: any) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[useBatchMutation] ${message}`, meta)
  }
}
