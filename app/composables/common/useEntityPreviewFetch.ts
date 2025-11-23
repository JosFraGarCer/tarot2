// app/composables/common/useEntityPreviewFetch.ts
import { computed, shallowRef } from 'vue'
import { hash } from 'ohash'
import { useAsyncData, useNuxtApp } from '#imports'
import { useApiFetch } from '@/utils/fetcher'

export interface EntityPreviewOptions {
  kind: string
  id: string | number | null | undefined
  lang?: string | null
  query?: Record<string, any>
  transform?: (data: any) => any
  immediate?: boolean
}

interface CachedEntry {
  timestamp: number
  data: any
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

  function setCache(payload: any) {
    const cacheKey = key.value
    if (!cacheKey) return
    previewCache.set(cacheKey, { data: payload, timestamp: Date.now() })
  }

  const asyncKey = computed(() => {
    if (!options.kind || options.id == null) return null
    return `entity-preview:${key.value}`
  })

  const { data, pending, error, refresh } = useAsyncData(asyncKey, async () => {
    const cacheEntry = resolveCache()
    if (cacheEntry) {
      return cacheEntry.data
    }

    if (!options.kind || options.id == null) return null

    const endpoint = buildEndpoint(options.kind)
    if (!endpoint) return null

    const response = await apiFetch<any>(`${endpoint}/${options.id}`, {
      method: 'GET',
      params: options.lang ? { lang: options.lang, ...(options.query ?? {}) } : options.query,
    })

    const payload = options.transform ? options.transform(response?.data ?? response ?? null) : response?.data ?? response ?? null
    setCache(payload)
    return payload
  }, {
    server: true,
    immediate: options.immediate ?? true,
    lazy: false,
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
