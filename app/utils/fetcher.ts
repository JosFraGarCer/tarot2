import { $fetch as ofetch, type FetchContext, type FetchRequest, type FetchOptions } from 'ofetch'

const etagStore = new Map<string, string>()
const responseCache = new Map<string, any>()

function toStable(value: any): any {
  if (Array.isArray(value)) {
    return value.map((entry) => toStable(entry))
  }
  if (value && typeof value === 'object') {
    const sorted = Object.keys(value).sort().reduce<Record<string, any>>((acc, key) => {
      acc[key] = toStable(value[key])
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
    const method = (options.method ?? 'GET').toString().toUpperCase()
    const cacheKey = buildCacheKey(request, options)
    options.context = { ...(options.context || {}), __cacheKey: cacheKey }

    if (method === 'GET') {
      options.retry = options.retry ?? 2
      options.retryDelay = options.retryDelay ?? 200
      options.retryStatusCodes = options.retryStatusCodes ?? [408, 425, 429, 500, 502, 503, 504]
      const headers = new Headers(ensureHeaders(options))
      const etag = etagStore.get(cacheKey)
      if (etag && !headers.has('If-None-Match')) {
        headers.set('If-None-Match', etag)
      }
      options.headers = Object.fromEntries(headers.entries())
    } else {
      options.retry = options.retry ?? 0
      options.headers = ensureHeaders(options)
    }
  },
  onResponse({ request, response, options }: FetchContext) {
    const method = (options.method ?? 'GET').toString().toUpperCase()
    const cacheKey = (options.context as any)?.__cacheKey ?? buildCacheKey(request, options)
    if (method !== 'GET') return

    if (response.status === 304) {
      const cached = responseCache.get(cacheKey)
      if (cached !== undefined) {
        response._data = cached
      }
      return
    }

    const etag = response.headers.get('etag')
    if (etag) {
      etagStore.set(cacheKey, etag)
    }
    responseCache.set(cacheKey, response._data)
  },
  onResponseError({ request, response, options }: FetchContext) {
    if (!response) return
    if (response.status !== 304) return
    const cacheKey = (options.context as any)?.__cacheKey ?? buildCacheKey(request, options)
    const cached = responseCache.get(cacheKey)
    if (cached !== undefined) {
      response._data = cached
    }
  },
})
