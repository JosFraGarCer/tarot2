// app/composables/manage/useFilterOptions.ts
// Unified filter options fetching with batching support

import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { useLazyAsyncData } from '#imports'
import { useApiFetch } from '~/utils/fetcher'
import type { Tag } from '@shared/schemas/entities/tag'
import type { CardType } from '@shared/schemas/entities/cardtype'
import type { RoleBase } from '@shared/schemas/role'
import type { Arcana } from '@shared/schemas/entities/arcana'
import type { Facet } from '@shared/schemas/entities/facet'

// Role type for filter options (includes id from database)
interface RoleOption extends RoleBase {
  id: number
  created_at?: string
  modified_at?: string
}

export interface FilterOption {
  label: string
  value: number | string
}

export interface FilterOptions {
  tags: FilterOption[]
  cardTypes: FilterOption[]
  roles: FilterOption[]
  arcana: FilterOption[]
  facets: FilterOption[]
  tagParents: FilterOption[]
}

export function useFilterOptions(locale: string | Ref<string>) {
  const localeValue = computed(() =>
    typeof locale === 'string' ? locale : locale.value
  )

  const tagsLoaded = ref(false)
  const cardTypesLoaded = ref(false)
  const rolesLoaded = ref(false)
  const arcanaLoaded = ref(false)
  const facetsLoaded = ref(false)
  const parentLoaded = ref(false)

  const { data: tagData, execute: fetchTags } = useLazyAsyncData(
    () => `manage-filter-tags::${String(localeValue.value)}`,
    () => useApiFetch('/tag', {
      method: 'GET',
      params: { pageSize: 100, is_active: true, lang: String(localeValue.value) },
    }),
    { immediate: false, server: false }
  )

  const { data: cardTypeData, execute: fetchCardTypes } = useLazyAsyncData(
    () => `manage-filter-card-types::${String(localeValue.value)}`,
    () => useApiFetch('/card_type', {
      method: 'GET',
      params: { pageSize: 100, is_active: true, lang: String(localeValue.value) },
    }),
    { immediate: false, server: false }
  )

  const { data: roleData, execute: fetchRoles } = useLazyAsyncData(
    () => `manage-filter-roles::${String(localeValue.value)}`,
    () => useApiFetch('/role', {
      method: 'GET',
      params: { pageSize: 100, lang: String(localeValue.value) },
    }),
    { immediate: false, server: false }
  )

  const { data: arcanaData, execute: fetchArcana } = useLazyAsyncData(
    () => `manage-filter-arcana::${String(localeValue.value)}`,
    () => useApiFetch('/arcana', {
      method: 'GET',
      params: { pageSize: 100, is_active: true, lang: String(localeValue.value) },
    }),
    { immediate: false, server: false }
  )

  const { data: facetData, execute: fetchFacets } = useLazyAsyncData(
    () => `manage-filter-facets::${String(localeValue.value)}`,
    () => useApiFetch('/facet', {
      method: 'GET',
      params: { pageSize: 100, is_active: true, lang: String(localeValue.value) },
    }),
    { immediate: false, server: false }
  )

  const { data: parentData, execute: fetchParentTags } = useLazyAsyncData(
    () => `manage-filter-tag-parents::${String(localeValue.value)}`,
    () => useApiFetch('/tag', {
      method: 'GET',
      params: { pageSize: 100, parent_only: true, lang: String(localeValue.value) },
    }),
    { immediate: false, server: false }
  )

  async function loadTags() {
    if (!tagsLoaded.value) {
      tagsLoaded.value = true
      await fetchTags()
    }
  }

  async function loadCardTypes() {
    if (!cardTypesLoaded.value) {
      cardTypesLoaded.value = true
      await fetchCardTypes()
    }
  }

  async function loadRoles() {
    if (!rolesLoaded.value) {
      rolesLoaded.value = true
      await fetchRoles()
    }
  }

  async function loadArcana() {
    if (!arcanaLoaded.value) {
      arcanaLoaded.value = true
      await fetchArcana()
    }
  }

  async function loadFacets() {
    if (!facetsLoaded.value) {
      facetsLoaded.value = true
      await fetchFacets()
    }
  }

  async function loadTagParents() {
    if (!parentLoaded.value) {
      parentLoaded.value = true
      await fetchParentTags()
    }
  }

  function mapTagToOption(item: Tag): FilterOption {
    return {
      label: item.name ?? item.code ?? `#${item.id}`,
      value: item.id,
    }
  }

  function mapCardTypeToOption(item: CardType): FilterOption {
    return {
      label: item.name ?? item.code ?? `#${item.id}`,
      value: item.id,
    }
  }

  function mapRoleToOption(item: RoleOption): FilterOption {
    return {
      label: item.name ?? `#${item.id}`,
      value: item.id,
    }
  }

  function mapArcanaToOption(item: Arcana): FilterOption {
    return {
      label: item.name ?? item.code ?? `#${item.id}`,
      value: item.id,
    }
  }

  function mapFacetToOption(item: Facet): FilterOption {
    return {
      label: item.name ?? item.code ?? `#${item.id}`,
      value: item.id,
    }
  }

  function unwrapRows<T>(raw: unknown): T[] {
    if (!raw) return []
    if (Array.isArray(raw)) return raw as T[]
    if (Array.isArray((raw as { data?: unknown }).data)) return (raw as { data: T[] }).data as T[]
    if (Array.isArray((raw as { results?: unknown }).results)) return (raw as { results: T[] }).results as T[]
    return []
  }

  const tagOptions = computed(() =>
    unwrapRows<Tag>(tagData.value).map(mapTagToOption)
  )

  const cardTypeOptions = computed(() =>
    unwrapRows<CardType>(cardTypeData.value).map(mapCardTypeToOption)
  )

  const roleOptions = computed(() =>
    unwrapRows<RoleOption>(roleData.value).map(mapRoleToOption)
  )

  const arcanaOptions = computed(() =>
    unwrapRows<Arcana>(arcanaData.value).map(mapArcanaToOption)
  )

  const facetOptions = computed(() =>
    unwrapRows<Facet>(facetData.value).map(mapFacetToOption)
  )

  const parentOptions = computed(() =>
    unwrapRows<Tag>(parentData.value).map(mapTagToOption)
  )

  return {
    tagsLoaded,
    cardTypesLoaded,
    rolesLoaded,
    arcanaLoaded,
    facetsLoaded,
    parentLoaded,
    tagOptions,
    cardTypeOptions,
    roleOptions,
    arcanaOptions,
    facetOptions,
    parentOptions,
    loadTags,
    loadCardTypes,
    loadRoles,
    loadArcana,
    loadFacets,
    loadTagParents,
  }
}
