import { z } from 'zod'

export function parseStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined
  if (Array.isArray(value)) {
    const arr = value
      .flatMap((entry) => String(entry ?? '').trim())
      .filter((entry) => entry.length > 0)
    return arr.length ? arr : []
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          const arr = parsed
            .flatMap((entry) => String(entry ?? '').trim())
            .filter((entry) => entry.length > 0)
          return arr.length ? arr : []
        }
      } catch {
        // ignore JSON parse error and fallback to comma split
      }
    }
    const parts = trimmed.split(',').map((entry) => entry.trim()).filter((entry) => entry.length > 0)
    return parts.length ? parts : []
  }
  return [String(value)].filter((entry) => entry.length > 0)
}

export function parseNumberArray(value: unknown): number[] | undefined {
  if (value === undefined || value === null) return undefined
  if (Array.isArray(value)) {
    const arr = value
      .flatMap((entry) => Number(entry))
      .filter((entry) => Number.isFinite(entry))
    return arr.length ? arr : []
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          const arr = parsed
            .flatMap((entry) => Number(entry))
            .filter((entry) => Number.isFinite(entry))
          return arr.length ? arr : []
        }
      } catch {
        // ignore JSON parse error and fallback to comma split
      }
    }
    const parts = trimmed
      .split(',')
      .map((entry) => Number(entry.trim()))
      .filter((entry) => Number.isFinite(entry))
    return parts.length ? parts : []
  }
  const num = Number(value)
  return Number.isFinite(num) ? [num] : []
}

export const stringArrayParam = z.preprocess((value) => parseStringArray(value), z.array(z.string()).optional())

export const numberArrayParam = z.preprocess((value) => parseNumberArray(value), z.array(z.number().int()).optional())

export const languageCodeSchema = z
  .string()
  .min(2)
  .max(10)
  .regex(/^[a-z]{2}(?:-[a-z]{2})?$/i)
  .transform((val) => val.toLowerCase())

export const optionalLanguageCodeSchema = languageCodeSchema.optional()

export const languageCodeWithDefault = (defaultValue = 'en') => languageCodeSchema.default(defaultValue)

export const sortDirectionSchema = z.enum(['asc', 'desc']).optional()
