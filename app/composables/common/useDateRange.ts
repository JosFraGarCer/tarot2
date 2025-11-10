// app/composables/common/useDateRange.ts

export interface DateRangeValue {
  from?: string | Date | null
  to?: string | Date | null
}

export function toIso(value?: string | Date | null): string | undefined {
  if (!value) return undefined
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export function normalizeRange(range?: [string | Date, string | Date] | DateRangeValue | null) {
  if (!range) return { from: undefined, to: undefined }
  if (Array.isArray(range)) {
    const [a, b] = range
    return { from: toIso(a), to: toIso(b) }
  }
  return { from: toIso(range.from ?? null), to: toIso(range.to ?? null) }
}
