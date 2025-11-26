// app/composables/manage/useEntityRelations.ts
import { computed, ref, unref } from 'vue'
import { useI18n } from '#imports'

type Option = { label: string; value: number }

interface RelationFetchOptions {
  locale?: string | { value: string | undefined | null }
}

function unwrapLocale(locale: RelationFetchOptions['locale']): string {
  if (!locale) return 'en'
  const value = typeof locale === 'string' ? locale : unref(locale)
  return (value || 'en').toString()
}

async function fetchRelation(endpoint: string, locale: string): Promise<Option[]> {
  try {
    const response = await $fetch<any>(`/api${endpoint}`, {
      method: 'GET',
      params: {
        pageSize: 100,
        is_active: true,
        lang: locale,
      },
    })
    const rows: any[] = Array.isArray(response?.data)
      ? response.data
      : Array.isArray((response as any)?.results)
        ? (response as any).results
        : []

    return rows.map((item) => ({
      label: item?.name ?? item?.title ?? item?.code ?? `#${item?.id ?? ''}`,
      value: item?.id ?? item?.value ?? item?.code,
    }))
      .filter((option) => option.label && option.value !== undefined)
  } catch (error) {
    console.warn(`[useEntityRelations] Failed to fetch ${endpoint}`, error)
    return []
  }
}

export function useEntityRelations(options: RelationFetchOptions = {}) {
  const { locale } = useI18n()
  const localeRef = computed(() => options.locale ?? locale)

  const arcanaOptions = ref<Option[]>([])
  const cardTypeOptions = ref<Option[]>([])
  const facetOptions = ref<Option[]>([])

  const loading = ref(false)
  const loaded = ref(false)

  async function loadAll(force = false) {
    if (loading.value || (loaded.value && !force)) return
    loading.value = true
    const lang = unwrapLocale(localeRef.value)

    const [arcana, cardTypes, facets] = await Promise.all([
      fetchRelation('/arcana', lang),
      fetchRelation('/card_type', lang),
      fetchRelation('/facet', lang),
    ])

    arcanaOptions.value = arcana
    cardTypeOptions.value = cardTypes
    facetOptions.value = facets
    loaded.value = true
    loading.value = false
  }

  return {
    arcanaOptions,
    cardTypeOptions,
    facetOptions,
    loadAll,
    loading: computed(() => loading.value),
    loaded: computed(() => loaded.value),
  }
}
