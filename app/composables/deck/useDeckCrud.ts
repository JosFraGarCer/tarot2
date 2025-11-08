// /app/composables/deck/useDeckCrud.ts
import { computed, unref, type ComputedRef, type MaybeRef } from 'vue'
import type { ManageCrud } from '@/types/manage'
import { useCardTypeCrud } from '~/composables/manage/useCardType'
import { useBaseCardCrud } from '~/composables/manage/useBaseCard'
import { useWorldCrud } from '~/composables/manage/useWorld'
import { useArcanaCrud } from '~/composables/manage/useArcana'
import { useFacetCrud } from '~/composables/manage/useFacet'
import { useSkillCrud } from '~/composables/manage/useSkill'

type DeckEntityKey = 'cardtype' | 'basecard' | 'world' | 'arcana' | 'facet' | 'skill'

type AnyCrud = ManageCrud<any, any, any>

type CrudFactory = () => AnyCrud

const crudFactories: Record<DeckEntityKey, CrudFactory> = {
  cardtype: useCardTypeCrud as CrudFactory,
  basecard: useBaseCardCrud as CrudFactory,
  world: useWorldCrud as CrudFactory,
  arcana: useArcanaCrud as CrudFactory,
  facet: useFacetCrud as CrudFactory,
  skill: useSkillCrud as CrudFactory,
}

const crudCache = new Map<DeckEntityKey, AnyCrud>()

function normalizeEntity(value: string): DeckEntityKey | null {
  const key = value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/_/g, '')

  if ((['cardtype', 'cardtypes'] as const).includes(key as any)) return 'cardtype'
  if ((['basecard', 'basecards'] as const).includes(key as any)) return 'basecard'
  if ((['world', 'worlds'] as const).includes(key as any)) return 'world'
  if ((['arcana'] as const).includes(key as any)) return 'arcana'
  if ((['facet', 'facets'] as const).includes(key as any)) return 'facet'
  if ((['skill', 'skills'] as const).includes(key as any)) return 'skill'

  return null
}

export function useDeckCrud(entity: MaybeRef<string>) {
  const entityKey = normalizeEntity(unref(entity) ?? '')

  if (!entityKey) {
    if (import.meta.dev) {
      console.warn('[useDeckCrud] Unsupported entity provided:', unref(entity))
    }
    const empty = computed(() => [] as any[])
    const loading = computed(() => false)
    const error = computed(() => null as string | null)
    return {
      items: empty,
      loading,
      error,
      fetch: async () => [] as any[],
      crud: null as AnyCrud | null,
    }
  }

  const crudFactory = crudFactories[entityKey]
  let crud = crudCache.get(entityKey)
  if (!crud) {
    crud = crudFactory()
    crudCache.set(entityKey, crud)
  }

  const isDev = import.meta.dev
  const log = (...args: any[]) => {
    if (!isDev) return
    console.debug('[useDeckCrud]', ...args)
  }

  function resetPagination() {
    if (crud.pagination?.value) {
      crud.pagination.value.page = 1
    }
  }

  async function fetch(options?: { pageSize?: number; status?: string; is_active?: boolean; page?: number; resetPage?: boolean }) {
    if (!crud) return [] as any[]

    if (isDev) {
      log('fetch:start', {
        options,
        paginationBefore: { ...crud.pagination?.value },
        filtersBefore: { ...crud.filters },
      })
    }

    if (crud.pagination?.value) {
      if (options?.pageSize) {
        crud.registerPageSizeOptions?.(options.pageSize)
        crud.pagination.value.pageSize = options.pageSize
      }

      if (options?.page !== undefined) {
        crud.pagination.value.page = options.page
      } else if (options?.resetPage ?? true) {
        resetPagination()
      }
    }

    if (crud.filters) {
      if (options?.status !== undefined) crud.filters.status = options.status
      if (options?.is_active !== undefined) crud.filters.is_active = options.is_active
    }

    const result = await crud.fetchList()

    if (isDev) {
      log('fetch:end', {
        paginationAfter: { ...crud.pagination?.value },
        itemsCount: result.length,
      })
    }

    return result
  }

  const items: ComputedRef<any[]> = computed(() => crud.items?.value ?? [])
  const loading = computed(() => crud.loading?.value ?? false)
  const error = computed(() => crud.error?.value ?? null)

  return {
    items,
    loading,
    error,
    fetch,
    crud,
    resetPagination,
  }
}
