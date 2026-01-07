// shared/utils/validation.ts
/**
 * Shared validation and object utilities for Nuxt 5.
 */

/**
 * Basic deep clone utility. 
 * Uses native structuredClone if available.
 */
export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value
  
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {
      // Fallback
    }
  }

  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return value
  }
}

/**
 * Prunes undefined values from an object.
 */
export function pruneUndefined<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj }
  Object.keys(result).forEach(key => {
    if (result[key] === undefined) {
      delete result[key]
    }
  })
  return result
}
