import { computed, ref } from 'vue'
import { useLazyAsyncData } from '#imports'
import { useApiFetch } from '~/utils/fetcher'

export function useFilterOptions(localeValue: () => string) {
  function unwrapRows(raw: unknown): Record<string, unknown>[] {
    if (!raw || typeof raw !== 'object') return []
    if (Array.isArray(raw)) return raw as Record<string, unknown>[]
    const r = raw as Record<string, unknown>
    if (Array.isArray(r.data)) return r.data as Record<string, unknown>[]
    if (Array.isArray(r.results)) return r.results as Record<string, unknown>[]
    return []
  }

  // --- Data Fetching ---
  const { data: tagData, execute: fetchTags } = useLazyAsyncData(
    () => `manage-filter-tags::${String(localeValue())}`,
    () => useApiFetch('/tag', {
      method: 'GET',
      params: { pageSize: 100, is_active: true, lang: String(localeValue()) },
    }),
    { immediate: false, server: false }
  )

  const { data: cardTypeData, execute: fetchCardTypes } = useLazyAsyncData(
    () => `manage-filter-card-types::${String(localeValue())}`,
    () => useApiFetch('/card_type', {
      method: 'GET',
      params: { pageSize: 100, is_active: true, lang: String(localeValue()) },
    }),
    { immediate: false, server: false }
  )

  const { data: roleData, execute: fetchRoles } = useLazyAsyncData(
    () => `manage-filter-roles::${String(localeValue())}`,
    () => useApiFetch('/role', {
      method: 'GET',
      params: { pageSize: 100, lang: String(localeValue()) },
    }),
    { immediate: false, server: false }
  )

  const { data: arcanaData, execute: fetchArcana } = useLazyAsyncData(
    () => `manage-filter-arcana::${String(localeValue())}`,
    () => useApiFetch('/arcana', {
      method: 'GET',
      params: { pageSize: 100, is_active: true, lang: String(localeValue()) },
    }),
    { immediate: false, server: false }
  )

  const { data: facetData, execute: fetchFacets } = useLazyAsyncData(
    () => `manage-filter-facets::${String(localeValue())}`,
    () => useApiFetch('/facet', {
      method: 'GET',
      params: { pageSize: 100, is_active: true, lang: String(localeValue()) },
    }),
    { immediate: false, server: false }
  )

  const { data: parentData, execute: fetchParentTags } = useLazyAsyncData(
    () => `manage-filter-tag-parents::${String(localeValue())}`,
    () => useApiFetch('/tag', {
      method: 'GET',
      params: { pageSize: 100, parent_only: true, lang: String(localeValue()) },
    }),
    { immediate: false, server: false }
  )

  // --- Computed Options ---
  const tagOptions = computed(() => unwrapRows(tagData.value).map((item) => ({
    label: (item.name as string) ?? (item.code as string) ?? `#${item.id}`,
    id: item.id,
  })))

  const cardTypeOptions = computed(() => unwrapRows(cardTypeData.value).map((item) => ({
    label: (item.name as string) ?? (item.code as string) ?? `#${item.id}`,
    id: item.id,
  })))

  const roleOptions = computed(() => unwrapRows(roleData.value).map((item) => ({
    label: (item.name as string) ?? `#${item.id}`,
    id: item.id,
  })))

  const arcanaOptions = computed(() => unwrapRows(arcanaData.value).map((item) => ({
    label: (item.name as string) ?? (item.code as string) ?? `#${item.id}`,
    id: item.id,
  })))

  const facetOptionsRaw = computed(() => unwrapRows(facetData.value).map((item) => ({
    label: (item.name as string) ?? (item.code as string) ?? `#${item.id}`,
    id: item.id,
  })))

  const parentOptions = computed(() => unwrapRows(parentData.value).map((item) => ({
    label: (item.name as string) ?? (item.code as string) ?? `#${item.id}`,
    id: item.id,
  })))

  return {
    // Actions
    fetchTags,
    fetchCardTypes,
    fetchRoles,
    fetchArcana,
    fetchFacets,
    fetchParentTags,

    // Options
    tagOptions,
    cardTypeOptions,
    roleOptions,
    arcanaOptions,
    facetOptionsRaw,
    parentOptions,
  }
}
