// app/composables/common/useQuerySync.ts
import { useRoute, useRouter } from '#imports'

export interface QuerySyncOptions<T extends Record<string, any>> {
  parse?: (q: Record<string, any>) => T
  serialize?: (state: T) => Record<string, any>
  replace?: boolean
}

export function useQuerySync<T extends Record<string, any>>(initial: T, opts: QuerySyncOptions<T> = {}) {
  const route = useRoute()
  const router = useRouter()

  function read(): T {
    try {
      const raw = route.query || {}
      return (opts.parse ? opts.parse(raw as any) : (raw as any)) as T
    } catch {
      return initial
    }
  }

  async function write(state: T) {
    const query = opts.serialize ? opts.serialize(state) : (state as any)
    await router.replace({ query })
  }

  return { read, write }
}
