// app/composables/common/useEntityPreviewFetch.ts
import { computed } from 'vue'
import { hash } from 'ohash'
import { useAsyncData, useNuxtApp } from '#imports'
import { useApiFetch } from '@/utils/fetcher'

// Generic entity data type - entities have at minimum an id
export interface EntityData {
  id: number | string
  [key: string]: unknown
}

export interface EntityPreviewOptions<T = EntityData> {
  kind: string
  id: string | number | null | undefined
  lang?: string | null
  query?: Record<string, string | number | boolean | undefined>
  transform?: (data: T | null) => T | null
  immediate?: boolean
}

interface CachedEntry<T = EntityData> {
  timestamp: number
  data: T | null
}

const previewCache = new Map<string, CachedEntry>()
const CACHE_TTL = 1000 * 60 * 2 // 2 minutes

export function useEntityPreviewFetch(options: EntityPreviewOptions) {
  const apiFetch = useApiFetch
  const nuxt = useNuxtApp()
  const key = computed(() => {
    const normalizedId = options.id ?? ''
    return hash({
      kind: options.kind,
      id: normalizedId,
      lang: options.lang ?? null,
      query: options.query ?? null,
    })
  })

  function resolveCache(): CachedEntry | null {
    const cacheKey = key.value
    if (!cacheKey) return null
    const entry = previewCache.get(cacheKey)
    if (!entry) return null
    const isExpired = Date.now() - entry.timestamp > CACHE_TTL
    if (isExpired) {
      previewCache.delete(cacheKey)
      return null
    }
    return entry
  }

  function setCache(payload: EntityData | null) {
    const cacheKey = key.value
    if (!cacheKey) return
    previewCache.set(cacheKey, { data: payload, timestamp: Date.now() })
  }

  const asyncKey = computed(() => {
    if (!options.kind || options.id == null) return null
    return `entity-preview:${key.value}`
  })

  const { data, pending, error, refresh } = useAsyncData(asyncKey as any, async () => {
    const cacheEntry = resolveCache()
    if (cacheEntry) {
      return cacheEntry.data
    }

    if (!options.kind || options.id == null) return null

    const endpoint = buildEndpoint(options.kind)
    if (!endpoint) return null

    const response = await apiFetch<{ data?: EntityData }>(`${endpoint}/${options.id}`, {
      method: 'GET',
      params: options.lang ? { lang: options.lang, ...(options.query ?? {}) } : options.query,
    })

    const rawData = response?.data ?? (response as unknown as EntityData) ?? null
    const payload = options.transform ? options.transform(rawData) : rawData
    setCache(payload)
    return payload
  }, {
    server: true,
    immediate: options.immediate ?? true,
    lazy: true,
    deep: false, // Nuxt 5 recommendation: shallow reactivity for API data
    getCachedData: (key) => {
      // Integration with Nuxt 5/Future payload cache
      const cacheEntry = resolveCache()
      return cacheEntry?.data
    }
  })

  const refreshPreview = async () => {
    const cacheKey = key.value
    if (cacheKey) previewCache.delete(cacheKey)
    await refresh()
  }

  const clearPreviewCache = () => {
    const cacheKey = key.value
    if (cacheKey) previewCache.delete(cacheKey)
  }

  nuxt.hook('app:beforeMount', () => {
    const cacheEntry = resolveCache()
    if (cacheEntry && !data.value) {
      data.value = cacheEntry.data
    }
  })

  return {
    data,
    pending,
    error,
    refresh: refreshPreview,
    clear: clearPreviewCache,
  }
}

function buildEndpoint(kind: string): string | null {
  const normalized = kind.toLowerCase()
  const map: Record<string, string> = {
    arcana: '/arcana',
    arcana_translation: '/arcana',
    arcana_translations: '/arcana',
    base_card: '/base_card',
    base_card_translation: '/base_card',
    base_card_translations: '/base_card',
    base_card_type: '/card_type',
    base_card_type_translation: '/card_type',
    world: '/world',
    world_translation: '/world',
    world_card: '/world_card',
    facet: '/facet',
    facet_translation: '/facet',
    feedback: '/feedback',
  }

  return map[normalized] ?? (normalized ? `/${normalized}` : null)
}
