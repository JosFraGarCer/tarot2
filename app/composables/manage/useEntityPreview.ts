import { ref } from 'vue'

export interface PreviewPayload {
  title: string
  img: string | null
  shortText: string | null
  description: string | null
  legacyEffects: boolean
  effectsMarkdown: string | null
}

export interface PreviewOptions {
  t?: (k: string) => string
  locale?: string
}

export function useEntityPreview() {
  const previewOpen = ref(false)
  const previewData = ref<PreviewPayload | null>(null)

  function setPreviewOpen(value: boolean) {
    previewOpen.value = value
    if (!value) previewData.value = null
  }

  function openPreviewFromEntity(entity: any, options?: PreviewOptions) {
    if (!entity) return
    const t = options?.t
    const locale = options?.locale || entity?.language_code_resolved || entity?.language_code || 'en'
    const { legacyEffects, effectsMarkdown } = resolveEffects(entity, locale)
    previewData.value = {
      title: entity.name ?? entity.title ?? entity.code ?? (t ? t('common.untitled') : '—'),
      img: entity.image ?? entity.thumbnail_url ?? null,
      shortText: entity.short_text ?? entity.summary ?? null,
      description: entity.description ?? null,
      legacyEffects,
      effectsMarkdown,
    }
    previewOpen.value = true
  }

  return {
    previewOpen,
    previewData,
    setPreviewOpen,
    openPreviewFromEntity,
  }
}

function resolveEffects(entity: any, locale: string): { legacyEffects: boolean; effectsMarkdown: string | null } {
  const legacy = !!entity?.legacy_effects
  if (!legacy) {
    return { legacyEffects: false, effectsMarkdown: null }
  }

  const effects = entity?.effects
  if (!effects || typeof effects !== 'object') {
    return { legacyEffects: true, effectsMarkdown: null }
  }

  const normalizedLocale = String(locale || 'en').toLowerCase()
  const candidates = [normalizedLocale]
  if (!candidates.includes('en')) candidates.push('en')

  const values = Object.values(effects as Record<string, unknown>)
  for (const value of candidates
    .map((code) => (effects as Record<string, unknown>)[code])
    .concat(values)) {
    const lines = toLines(value)
    if (lines && lines.length) {
      const markdown = lines
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n\n')
      if (markdown) {
        return { legacyEffects: true, effectsMarkdown: markdown }
      }
    }
  }

  return { legacyEffects: true, effectsMarkdown: null }
}

function toLines(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  if (typeof value === 'string') {
    return value ? [value] : null
  }
  return null
}
