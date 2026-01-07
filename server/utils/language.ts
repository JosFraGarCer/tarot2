// server/utils/language.ts
import type { H3Event } from 'h3'

export type LanguageAware = {
  language_code?: string | null
  language_code_resolved?: string | null
  language_is_fallback?: boolean
}

function resolveFallbackFlag(record: LanguageAware, requestedLang?: string | null): boolean {
  if (!record || typeof record !== 'object') return false
  const resolved = (record.language_code_resolved ?? record.language_code ?? '').toString().toLowerCase()
  if (!resolved) return false
  const requested = (requestedLang ?? 'en').toString().toLowerCase()
  if (!requested || requested === 'en') return false
  return resolved !== requested
}

function applyFallbackFlag(record: unknown, lang?: string | null) {
  if (!record || typeof record !== 'object') return
  const r = record as Record<string, unknown>
  if ('language_code_resolved' in r || 'language_code' in r) {
    const fallback = resolveFallbackFlag(record as LanguageAware, lang)
    ;(record as LanguageAware).language_is_fallback = fallback
  }

  if (Array.isArray(r.tags)) {
    for (const tag of r.tags) {
      applyFallbackFlag(tag, lang)
    }
  }
}

export function markLanguageFallback<TRow extends Record<string, unknown>>(
  rowOrRows: TRow | TRow[],
  requestedLang: string,
): TRow | TRow[] {
  const mark = (row: TRow) => {
    if (!row) return row
    const isFallback =
      row.language_code &&
      String(row.language_code).toLowerCase() !== requestedLang.toLowerCase()
    
    // Apply the recursive logic for nested entities (like tags)
    applyFallbackFlag(row, requestedLang)
    
    return {
      ...row,
      _isFallback: !!isFallback,
    }
  }

  if (Array.isArray(rowOrRows)) {
    return rowOrRows.map(mark)
  }
  return mark(rowOrRows)
}

export function getLoggerFromEvent(event?: H3Event | null) {
  return event?.context.logger ?? (globalThis as Record<string, unknown>).logger as { info?: (obj: unknown, msg?: string) => void; warn?: (obj: unknown, msg?: string) => void; error?: (obj: unknown, msg?: string) => void } | undefined
}
