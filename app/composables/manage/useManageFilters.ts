import type { AnyManageCrud } from '@/types/manage'
import type { EntityFilterConfig } from './useEntity'

export interface ManageFiltersOptions {
  config?: EntityFilterConfig
  multiFilterAliases?: string[]
  fetchOnReset?: boolean
}

export interface ManageFiltersApi {
  initializeDefaults: () => void
  resetFilters: () => void
}

function buildAliasMap(config: EntityFilterConfig | undefined) {
  const aliasByApiKey = new Map<string, string>()
  if (!config) return aliasByApiKey
  for (const [alias, target] of Object.entries(config)) {
    if (typeof target === 'string' && target) {
      aliasByApiKey.set(target, alias)
    } else if (target === true) {
      aliasByApiKey.set(alias, alias)
    }
  }
  return aliasByApiKey
}

export function useManageFilters(crud: AnyManageCrud, options: ManageFiltersOptions = {}): ManageFiltersApi {
  const config = options.config ?? crud?.filterConfig ?? {}
  const aliasByApiKey = buildAliasMap(config)
  const multiAliases = new Set(options.multiFilterAliases ?? ['tags'])
  const fetchOnReset = options.fetchOnReset ?? true

  function initializeDefaults() {
    const filters = crud?.filters as Record<string, any> | undefined
    if (!filters) return

    for (const [key, current] of Object.entries(filters)) {
      if (current !== true) continue
      const alias = aliasByApiKey.get(key) ?? key
      if (multiAliases.has(alias) || key.endsWith('_ids')) {
        filters[key] = []
      } else {
        filters[key] = undefined
      }
    }
  }

  function resetFilters() {
    const filters = crud?.filters as Record<string, any> | undefined
    if (filters) {
      for (const key of Object.keys(filters)) {
        const current = filters[key]
        if (Array.isArray(current) || multiAliases.has(key) || key.endsWith('_ids')) {
          filters[key] = []
          continue
        }
        if (typeof current === 'string') {
          filters[key] = ''
          continue
        }
        filters[key] = null
      }
    }

    const pagination = crud?.pagination?.value ?? crud?.pagination
    if (pagination) {
      pagination.page = 1
    }

    if (fetchOnReset) {
      void crud?.fetchList?.()
    }
  }

  return {
    initializeDefaults,
    resetFilters,
  }
}
