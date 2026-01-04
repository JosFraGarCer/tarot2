// app/composables/deck/useDeckCrud.ts
// /app/composables/deck/useDeckCrud.ts
import { computed, unref, type ComputedRef, type MaybeRef } from 'vue'
import type { ManageCrud } from '@/types/manage'
import type {
  ArcanaCreate,
  ArcanaList,
  ArcanaUpdate,
  BaseCardCreate,
  BaseCardList,
  BaseCardUpdate,
  CardTypeCreate,
  CardTypeList,
  CardTypeUpdate,
  FacetCreate,
  FacetList,
  FacetUpdate,
  SkillCreate,
  SkillList,
  SkillUpdate,
  WorldCreate,
  WorldList,
  WorldUpdate,
} from '@/types/entities'
import { useCardTypeCrud } from '~/composables/manage/useCardType'
import { useBaseCardCrud } from '~/composables/manage/useBaseCard'
import { useWorldCrud } from '~/composables/manage/useWorld'
import { useArcanaCrud } from '~/composables/manage/useArcana'
import { useFacetCrud } from '~/composables/manage/useFacet'
import { useSkillCrud } from '~/composables/manage/useSkill'

export const DECK_ENTITY_NAMES = ['cardType', 'baseCard', 'world', 'arcana', 'facet', 'skill'] as const
export type DeckEntityName = typeof DECK_ENTITY_NAMES[number]

export const DECK_ENTITY_KEYS = ['cardtype', 'basecard', 'world', 'arcana', 'facet', 'skill'] as const
export type DeckEntityKey = typeof DECK_ENTITY_KEYS[number]

type DeckCrudRegistry = {
  cardtype: ManageCrud<CardTypeList, CardTypeCreate, CardTypeUpdate>
  basecard: ManageCrud<BaseCardList, BaseCardCreate, BaseCardUpdate>
  world: ManageCrud<WorldList, WorldCreate, WorldUpdate>
  arcana: ManageCrud<ArcanaList, ArcanaCreate, ArcanaUpdate>
  facet: ManageCrud<FacetList, FacetCreate, FacetUpdate>
  skill: ManageCrud<SkillList, SkillCreate, SkillUpdate>
}

type CrudFactoryMap = { [K in DeckEntityKey]: () => DeckCrudRegistry[K] }

type CrudItems<TKey extends DeckEntityKey> = DeckCrudRegistry[TKey]['items'] extends { value: infer Items }
  ? Items
  : never

type DeckCrudFetchOptions = {
  pageSize?: number
  status?: string
  is_active?: boolean
  page?: number
  resetPage?: boolean
}

export type DeckCrudSuccess<TKey extends DeckEntityKey> = {
  items: ComputedRef<CrudItems<TKey>>
  loading: ComputedRef<boolean>
  error: ComputedRef<string | null>
  fetch: (options?: DeckCrudFetchOptions) => Promise<CrudItems<TKey>>
  crud: DeckCrudRegistry[TKey]
  resetPagination: () => void
}

type DeckCrudFallback = {
  items: ComputedRef<never[]>
  loading: ComputedRef<boolean>
  error: ComputedRef<string | null>
  fetch: () => Promise<never[]>
  crud: null
  resetPagination: () => void
}

export type DeckCrudResult = DeckCrudSuccess<DeckEntityKey> | DeckCrudFallback

const crudFactories: CrudFactoryMap = {
  cardtype: useCardTypeCrud,
  basecard: useBaseCardCrud,
  world: useWorldCrud,
  arcana: useArcanaCrud,
  facet: useFacetCrud,
  skill: useSkillCrud,
}

const crudCache = new Map<DeckEntityKey, DeckCrudRegistry[DeckEntityKey]>()

const aliasMap: Record<string, DeckEntityKey> = {
  cardtype: 'cardtype',
  cardtypes: 'cardtype',
  basecard: 'basecard',
  basecards: 'basecard',
  world: 'world',
  worlds: 'world',
  arcana: 'arcana',
  facet: 'facet',
  facets: 'facet',
  skill: 'skill',
  skills: 'skill',
}

function normalizeEntity(value: string): DeckEntityKey | null {
  const key = value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/_/g, '')

  return aliasMap[key] ?? null
}

function createDeckCrud<TKey extends DeckEntityKey>(entityKey: TKey): DeckCrudSuccess<TKey> {
  let crud = crudCache.get(entityKey) as DeckCrudRegistry[TKey] | undefined
  if (!crud) {
    const instance = crudFactories[entityKey]()
    crudCache.set(entityKey, instance)
    crud = instance
  }

  const isDev = import.meta.dev
  const log = (...args: unknown[]) => {
    if (!isDev) return
    console.debug('[useDeckCrud]', ...args)
  }

  const resetPagination = () => {
    const pagination = crud.pagination?.value
    if (pagination) {
      pagination.page = 1
    }
  }

  const fetch: DeckCrudSuccess<TKey>['fetch'] = async (options) => {
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

  const items = computed<CrudItems<TKey>>(() => crud.items.value)
  const loading = computed(() => crud.loading?.value ?? false)
  const error = computed(() => crud.error?.value ?? null)

  return { items, loading, error, fetch, crud, resetPagination }
}

export function useDeckCrud(entity: MaybeRef<string>): DeckCrudResult {
  const entityKey = normalizeEntity(unref(entity) ?? '')

  if (!entityKey) {
    if (import.meta.dev) {
      console.warn('[useDeckCrud] Unsupported entity provided:', unref(entity))
    }
    const emptyItems = computed<never[]>(() => [])
    const constantFalse = computed(() => false)
    const constantNull = computed(() => null as string | null)
    return {
      items: emptyItems,
      loading: constantFalse,
      error: constantNull,
      fetch: async () => [],
      crud: null,
      resetPagination: () => {},
    }
  }

  return createDeckCrud(entityKey)
}
