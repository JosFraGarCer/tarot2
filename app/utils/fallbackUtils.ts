// app/utils/fallbackUtils.ts
export type FallbackStatus = 'complete' | 'partial' | 'missing'

export interface FallbackAwareEntity {
  language_code?: string | null
  language_code_resolved?: string | null
  language_is_fallback?: boolean | null
  [key: string]: unknown
}

function normalizeLang(value?: string | null): string {
  return (value ?? '').toString().trim().toLowerCase()
}

export function isFallbackField(resolvedLang: string, requestedLang: string): boolean {
  const resolved = normalizeLang(resolvedLang)
  const requested = normalizeLang(requestedLang)
  if (!resolved || !requested) return false
  if (requested === 'en') return false
  return resolved !== requested
}

export function getFallbackStatus(entity: FallbackAwareEntity | null | undefined): FallbackStatus {
  if (!entity || typeof entity !== 'object') return 'missing'

  const hasTranslation = Boolean(entity.language_code || entity.language_code_resolved)
  if (!hasTranslation) {
    return 'missing'
  }

  if (entity.language_is_fallback) {
    return 'partial'
  }

  const resolved = normalizeLang(entity.language_code_resolved || entity.language_code)
  if (!resolved) return 'missing'

  // If entity explicitly indicates fallback fields without flag, treat as partial
  if ('translationStatus' in entity && typeof (entity.translationStatus) === 'object') {
    const status = (entity.translationStatus as Record<string, unknown>) ?? {}
    if (status.isFallback === true) return 'partial'
    if (status.hasTranslation === false) return 'missing'
  }

  return 'complete'
}
