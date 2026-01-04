// app/composables/manage/useEntityPreview.ts
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

  function openPreviewFromEntity(entity: unknown, options?: PreviewOptions) {
    const e = entity as Record<string, unknown>
    if (!e) return
    const t = options?.t
    const locale = options?.locale || (e?.language_code_resolved as string) || (e?.language_code as string) || 'en'
    const { legacyEffects, effectsMarkdown } = resolveEffects(e, locale)
    previewData.value = {
      title: (e.name as string) ?? (e.title as string) ?? (e.code as string) ?? (t ? t('common.untitled') : '—'),
      img: (e.image as string) ?? (e.thumbnail_url as string) ?? null,
      shortText: (e.short_text as string) ?? (e.summary as string) ?? null,
      description: (e.description as string) ?? null,
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

function resolveEffects(entity: Record<string, unknown>, locale: string): { legacyEffects: boolean; effectsMarkdown: string | null } {
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
