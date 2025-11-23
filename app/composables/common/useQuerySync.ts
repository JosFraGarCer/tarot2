// app/composables/common/useQuerySync.ts
import { reactive, watch, watchEffect, toValue, isReactive, isRef, toRaw, unref, type MaybeRefOrGetter } from 'vue'
import { useRoute, useRouter } from '#imports'

type RouteQueryValue = string | string[] | null | undefined

export interface UseQuerySyncOptions<TState extends Record<string, any>> {
  defaults: TState
  parse?: Partial<{ [K in keyof TState]: (value: RouteQueryValue) => TState[K] }>
  serialize?: Partial<{ [K in keyof TState]: (value: TState[K]) => RouteQueryValue }>
  replace?: boolean
  queryKeyMap?: Partial<Record<keyof TState, string>>
  parseState?: (query: Record<string, RouteQueryValue>, defaults: TState) => Partial<TState>
  serializeState?: (state: TState, defaults: TState) => Record<string, RouteQueryValue>
}

export interface UseQuerySyncReturn<TState extends Record<string, any>> {
  state: TState
  update: (patch: Partial<TState>, options?: { replace?: boolean }) => Promise<void>
  reset: (options?: { replace?: boolean }) => Promise<void>
  read: () => TState
}

export function useQuerySync<TState extends Record<string, any>>(
  options: MaybeRefOrGetter<UseQuerySyncOptions<TState>>,
): UseQuerySyncReturn<TState> {
  const route = useRoute()
  const router = useRouter()

  const resolvedOptions = () => toValue(options)
  const defaults = deepClone(resolvedOptions().defaults)
  const state = reactive(deepClone(defaults)) as TState

  let skipNextRouteSync = false
  let skipNextStateWatch = false
  let lastSerialized = ''

  function readRoute(): TState {
    const { parse = {}, queryKeyMap = {}, parseState } = resolvedOptions()
    const query = route.query || {}
    const next = deepClone(defaults)

    for (const key in defaults) {
      const queryKey = (queryKeyMap[key as keyof TState] ?? key) as string
      const raw = query[queryKey]
      if (raw === undefined) continue
      const parser = parse[key as keyof TState]
      const parsed = parser ? parser(raw as RouteQueryValue) : defaultParse(raw as RouteQueryValue, defaults[key])
      if (parsed !== undefined) {
        next[key] = parsed
      }
    }

    if (parseState) {
      const extra = parseState(query as Record<string, RouteQueryValue>, defaults)
      for (const key in extra) {
        if (extra[key] !== undefined) {
          next[key] = extra[key] as TState[Extract<keyof TState, string>]
        }
      }
    }

    return next
  }

  function applyState(next: TState) {
    skipNextStateWatch = true
    for (const key in next) {
      state[key] = next[key]
    }
  }

  function buildQuery(current: TState): Record<string, RouteQueryValue> {
    const { defaults: baseDefaults, serialize = {}, queryKeyMap = {}, serializeState } = resolvedOptions()
    const result: Record<string, RouteQueryValue> = {}

    for (const key in current) {
      const queryKey = (queryKeyMap[key as keyof TState] ?? key) as string
      const serializer = serialize[key as keyof TState]
      const value = current[key]
      const serialized = serializer ? serializer(value) : defaultSerialize(value, baseDefaults[key])
      const defaultValue = baseDefaults[key]

      if (isEqual(value, defaultValue)) continue
      if (isEmpty(serialized)) continue

      result[queryKey] = serialized
    }

    if (serializeState) {
      Object.assign(result, serializeState(current, baseDefaults))
    }

    return result
  }

  async function syncToRoute(current: TState, overrideReplace?: boolean) {
    if (!process.client) return
    const query = buildQuery(current)
    const serialized = stableStringify(query)
    if (serialized === lastSerialized) return

    lastSerialized = serialized
    skipNextRouteSync = true
    const replace = overrideReplace ?? resolvedOptions().replace ?? true
    await router[replace ? 'replace' : 'push']({ query })
  }

  function read(): TState {
    return deepClone(state)
  }

  async function update(patch: Partial<TState>, updateOptions?: { replace?: boolean }) {
    skipNextStateWatch = true
    for (const key in patch) {
      state[key] = patch[key] as TState[Extract<keyof TState, string>]
    }
    await syncToRoute(read(), updateOptions?.replace)
  }

  async function reset(resetOptions?: { replace?: boolean }) {
    applyState(deepClone(defaults))
    await syncToRoute(read(), resetOptions?.replace)
  }

  watchEffect(() => {
    const next = readRoute()
    applyState(next)
  })

  if (process.client) {
    watch(
      () => route.query,
      () => {
        if (skipNextRouteSync) {
          skipNextRouteSync = false
          return
        }
        const next = readRoute()
        applyState(next)
      },
    )

    watch(
      state,
      async () => {
        if (skipNextStateWatch) {
          skipNextStateWatch = false
          return
        }
        await syncToRoute(read())
      },
      { deep: true },
    )
  }

  return { state, update, reset, read }
}

function defaultParse(raw: RouteQueryValue, fallback: any) {
  if (raw == null) return fallback
  const value = Array.isArray(raw) ? raw[0] : raw

  if (Array.isArray(fallback)) {
    if (Array.isArray(raw)) return raw
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(Boolean)
    }
    return fallback
  }

  if (typeof fallback === 'number') {
    const num = Number(value)
    return Number.isFinite(num) ? num : fallback
  }

  if (typeof fallback === 'boolean') {
    if (value === 'true' || value === true) return true
    if (value === 'false' || value === false) return false
    return fallback
  }

  return value ?? fallback
}

function defaultSerialize(value: any, fallback: any): RouteQueryValue {
  if (value == null) return undefined

  if (Array.isArray(value)) {
    return value.length ? value.map(String) : undefined
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : undefined
  }

  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.toISOString() : undefined
  }

  if (typeof value === 'string') {
    return value.length ? value : undefined
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return value as RouteQueryValue
}

function unwrapClonable<T>(value: T): T {
  if (isRef(value)) {
    return unwrapClonable(unref(value))
  }

  if (isReactive(value)) {
    return unwrapClonable(toRaw(value))
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => unwrapClonable(item)) as unknown as T
  }

  if (value && typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [key, entry] of Object.entries(value as Record<string, any>)) {
      out[key] = unwrapClonable(entry)
    }
    return out as T
  }

  return value
}

function deepClone<T>(value: T): T {
  const plain = unwrapClonable(value)

  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(plain)
    } catch {
      // Fallback below
    }
  }

  return JSON.parse(JSON.stringify(plain))
}

function isEqual(a: any, b: any): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => item === b[index])
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }
  return a === b
}

function isEmpty(value: RouteQueryValue): boolean {
  if (value == null) return true
  if (Array.isArray(value)) return value.length === 0
  return value === ''
}

function stableStringify(value: Record<string, any>): string {
  const sortedKeys = Object.keys(value).sort()
  const normalized: Record<string, any> = {}
  for (const key of sortedKeys) {
    const entry = value[key]
    normalized[key] = Array.isArray(entry) ? [...entry] : entry
  }
  return JSON.stringify(normalized)
}
