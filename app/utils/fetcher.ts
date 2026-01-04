// app/utils/fetcher.ts
import { $fetch as ofetch, type FetchContext, type FetchRequest, type FetchOptions } from 'ofetch'
import { tryUseNuxtApp } from '#app'
import type { H3Event } from 'h3'

interface CacheEntry<T = unknown> {
  data: T
  storedAt: number
  ttl: number
}

const globalStores = {
  etags: new Map<string, string>(),
  responses: new Map<string, CacheEntry>(),
}

const serverStores = new WeakMap<H3Event, {
  etags: Map<string, string>
  responses: Map<string, CacheEntry>
}>()

const DEFAULT_TTL = 1000 * 60 * 5 // 5 minutes

function now() {
  return Date.now()
}

function getStores(event?: H3Event | null) {
  if (event) {
    let store = serverStores.get(event)
    if (!store) {
      store = {
        etags: new Map<string, string>(),
        responses: new Map<string, CacheEntry>(),
      }
      serverStores.set(event, store)
    }
    return store
  }
  return globalStores
}

function purgeExpired(entries: Map<string, CacheEntry>, etags: Map<string, string>) {
  const current = now()
  for (const [key, entry] of entries.entries()) {
    const ttl = entry.ttl ?? DEFAULT_TTL
    if (current - entry.storedAt > ttl) {
      entries.delete(key)
      etags.delete(key)
    }
  }
}

export function clearApiFetchCache(options: { pattern?: RegExp } = {}) {
  const { pattern } = options
  for (const key of globalStores.responses.keys()) {
    if (!pattern || pattern.test(key)) {
      globalStores.responses.delete(key)
      globalStores.etags.delete(key)
    }
  }
}

function resolveTTL(options: FetchOptions): number {
  const context = options.context as Record<string, unknown> | undefined
  const contextTTL = context?.cacheTTL
  if (typeof contextTTL === 'number' && Number.isFinite(contextTTL) && contextTTL > 0) {
    return contextTTL
  }
  return DEFAULT_TTL
}

function getCachedData<T = unknown>(key: string, store: Map<string, CacheEntry>, etags: Map<string, string>): T | undefined {
  const entry = store.get(key)
  if (!entry) return undefined
  const current = now()
  const ttl = entry.ttl ?? DEFAULT_TTL
  if (current - entry.storedAt > ttl) {
    store.delete(key)
    etags.delete(key)
    return undefined
  }
  return entry.data as T
}

function toStable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => toStable(entry))
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const sorted = Object.keys(obj).sort().reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = toStable(obj[key])
      return acc
    }, {})
    return sorted
  }
  return value
}

function buildCacheKey(request: FetchRequest, options: FetchOptions): string {
  const method = (options.method ?? 'GET').toString().toUpperCase()
  const url = typeof request === 'string' ? request : ('url' in request ? request.url : String(request))
  const params = options.params ? JSON.stringify(toStable(options.params)) : ''
  return `${method}:${url}:${params}`
}

function ensureHeaders(options: FetchOptions): Record<string, string> {
  const headers = new Headers(options.headers as Record<string, string> | undefined)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  return Object.fromEntries(headers.entries())
}

export const useApiFetch = ofetch.create({
  baseURL: '/api',
  credentials: 'include',
  retry: false,
  onRequest({ request, options }: FetchContext) {
    const nuxtApp = tryUseNuxtApp()
    const context = options.context as Record<string, unknown> | undefined
    const event = (context?.__requestEvent as H3Event | undefined) ?? nuxtApp?.ssrContext?.event
    const { etags, responses } = getStores(event)
    const logger = (nuxtApp?.$logger || event?.context.logger)
    const requestId = context?.requestId ?? event?.context.requestId

    const method = (options.method ?? 'GET').toString().toUpperCase()
    const cacheKey = buildCacheKey(request, options)
    options.context = {
      ...(options.context || {}),
      __cacheKey: cacheKey,
      __requestEvent: event,
      __fetchStartedAt: Date.now(),
      requestId,
    }

    const headers = new Headers(ensureHeaders(options))

    if (event?.node?.req?.headers?.cookie && !headers.has('cookie')) {
      headers.set('cookie', event.node.req.headers.cookie)
    }
    if (event?.node?.req?.headers?.authorization && !headers.has('authorization')) {
      headers.set('authorization', event.node.req.headers.authorization)
    }

    if (method === 'GET') {
      purgeExpired(responses, etags)
      options.retry = options.retry ?? 2
      options.retryDelay = options.retryDelay ?? 200
      options.retryStatusCodes = options.retryStatusCodes ?? [408, 425, 429, 500, 502, 503, 504]
      const etag = etags.get(cacheKey)
      if (etag && !headers.has('If-None-Match')) {
        headers.set('If-None-Match', etag)
      }
    } else {
      options.retry = options.retry ?? 0
    }

    options.headers = Object.fromEntries(headers.entries())

    logger?.debug('api.fetch.request', {
      method,
      url: typeof request === 'string' ? request : ('url' in request ? request.url : String(request)),
      cacheKey,
      requestId,
      ssr: import.meta.server,
    })
  },
  onResponse({ request, response, options }: FetchContext) {
    const method = (options.method ?? 'GET').toString().toUpperCase()
    const context = options.context as Record<string, unknown> | undefined
    const cacheKey = (context?.__cacheKey as string) ?? buildCacheKey(request, options)
    const event = context?.__requestEvent as H3Event | undefined
    const { etags, responses } = getStores(event)
    const nuxtApp = tryUseNuxtApp()
    const logger = (nuxtApp?.$logger || event?.context.logger)
    const startedAt = context?.__fetchStartedAt as number | undefined
    const duration = startedAt ? Date.now() - startedAt : undefined
    const requestId = context?.requestId ?? event?.context.requestId
    if (method !== 'GET') return

    if (response.status === 304) {
      const cached = getCachedData(cacheKey, responses, etags)
      if (cached !== undefined) {
        response._data = cached
      }
      logger?.debug('api.fetch.cache-hit', {
        cacheKey,
        status: response.status,
        durationMs: duration,
        requestId,
      })
      return
    }

    const etag = response.headers.get('etag')
    if (etag) {
      etags.set(cacheKey, etag)
    }
    responses.set(cacheKey, {
      data: response._data,
      storedAt: now(),
      ttl: resolveTTL(options),
    })

    logger?.debug('api.fetch.response', {
      cacheKey,
      status: response.status,
      durationMs: duration,
      requestId,
    })
  },
  onResponseError({ request, response, options }: FetchContext) {
    if (!response) return
    if (response.status !== 304) return
    const context = options.context as Record<string, unknown> | undefined
    const cacheKey = (context?.__cacheKey as string) ?? buildCacheKey(request, options)
    const event = context?.__requestEvent as H3Event | undefined
    const { etags, responses } = getStores(event)
    const cached = getCachedData(cacheKey, responses, etags)
    if (cached !== undefined) {
      response._data = cached
    }
  },
})
