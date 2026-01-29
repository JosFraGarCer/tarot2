// app/utils/objectUtils.ts
// Utility functions for object manipulation
// Extracted from EntitySlideover.vue to reduce duplication

export function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {
      /* noop */
    }
  }
  return JSON.parse(JSON.stringify(value)) as T
}

export function diffState<T extends Record<string, unknown>>(
  current: T,
  baseline: T,
  exclude: string[] = []
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(current)) {
    if (exclude.includes(key)) continue
    if (!deepEqual(current[key], baseline[key])) {
      result[key] = clone(current[key])
    }
  }
  return result
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return a === b
  if (typeof a !== typeof b) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => deepEqual(item, b[index]))
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object)
    const bKeys = Object.keys(b as object)
    if (aKeys.length !== bKeys.length) return false
    for (const key of aKeys) {
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false
    }
    return true
  }

  return false
}

export function isNotFoundError(err: unknown): boolean {
  const error = err as { status?: number; statusCode?: number; data?: { statusCode?: number; status?: number } }
  return error?.status === 404 || error?.statusCode === 404 || error?.data?.statusCode === 404
}

export function resolveErrorMessage(err: unknown, fallback = 'Unexpected error'): string {
  const error = err as { data?: { message?: string }; message?: string }
  return error?.data?.message || error?.message || fallback
}

export function omitNull<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    if (obj[key] !== null && obj[key] !== undefined) {
      result[key] = obj[key]
    }
  }
  return result
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}
