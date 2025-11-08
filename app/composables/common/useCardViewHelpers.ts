import { computed, unref } from 'vue'
import { useCardStatus } from '~/utils/status'

export interface CardViewHelperOptions {
  entity: string | { value: string }
  locale?: string | { value: string | undefined | null }
}

function toValue<T>(source: T | { value: T }): T {
  if (source && typeof source === 'object' && 'value' in source) {
    return (source as { value: T }).value
  }
  return source as T
}

export function useCardViewHelpers(options: CardViewHelperOptions) {
  const entityType = computed(() => toValue(options.entity))
  const currentLocale = computed(() => {
    const raw = options.locale ? toValue(options.locale) : undefined
    return typeof raw === 'string' ? raw : ''
  })

  const statusUtil = useCardStatus()
  const statusOptions = statusUtil.options()

  function resolveImage(src?: string | null): string {
    if (!src) return ''
    if (src.startsWith('http://') || src.startsWith('https://')) return src
    if (src.startsWith('/')) return src

    // src puede venir como "baseCard/foo.avif" o sólo "foo.avif"
    if (src.includes('/')) {
      // Ya incluye un prefijo de carpeta relativo a /img
      return `/img/${src}`
    }

    const type = entityType.value
    return type ? `/img/${type}/${src}` : `/img/${src}`
  }

  const DEFAULT_IMAGE = '/img/default.avif'

  function imageFallback(ev: Event) {
    const el = ev?.target as HTMLImageElement | undefined
    if (!el) return
    // Evitar bucles de error
    el.onerror = null
    el.src = DEFAULT_IMAGE
  }

  function titleOf(item: any): string {
    return item?.name ?? item?.title ?? item?.code ?? '—'
  }

  function isActive(item: any): boolean {
    return Boolean(item?.is_active ?? item?.isActive ?? false)
  }

  function langBadge(item: any): string | null {
    const resolved = (item?.language_code_resolved || item?.language_code || item?.lang || '').toString()
    if (!resolved) return null

    const locale = currentLocale.value
    return locale && resolved !== locale ? resolved : null
  }

  function getStatusMeta(value: string | null | undefined) {
    if (!value) return null
    return statusOptions.find(option => option.value === value) ?? null
  }

  function statusColor(value: string | null | undefined) {
    return getStatusMeta(value)?.color ?? 'neutral'
  }

  function statusVariant(value: string | null | undefined) {
    return getStatusMeta(value)?.variant ?? 'subtle'
  }

  function statusLabelKey(value: string | null | undefined) {
    return getStatusMeta(value)?.labelKey ?? 'status.draft'
  }

  return {
    resolveImage,
    imageFallback,
    titleOf,
    isActive,
    langBadge,
    statusColor,
    statusVariant,
    statusLabelKey,
  }
}
