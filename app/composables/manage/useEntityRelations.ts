// app/composables/manage/useEntityRelations.ts
import { computed, ref, unref } from 'vue'
import { useI18n } from '#imports'
import type { Arcana } from '~/shared/schemas/entities/arcana'
import type { CardType as CardTypeSchema } from '~/shared/schemas/entities/cardtype'
import type { Facet as FacetSchema } from '~/shared/schemas/entities/facet'

type Option = { label: string; value: number | string }

interface RelationFetchOptions {
  locale?: string | { value: string | undefined | null }
}

interface ListResponse<T> {
  data?: T[]
  results?: T[]
  items?: T[]
}

function unwrapLocale(locale: RelationFetchOptions['locale']): string {
  if (!locale) return 'en'
  const value = typeof locale === 'string' ? locale : unref(locale)
  return (value || 'en').toString()
}

function extractItems<T>(response: unknown): T[] {
  if (!response) return []
  const res = response as ListResponse<T>
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.results)) return res.results
  if (Array.isArray(res?.items)) return res.items
  return []
}

async function fetchRelation<T extends { id: number | string; name?: string; title?: string; code?: string }>(
  endpoint: string,
  locale: string
): Promise<Option[]> {
  try {
    const response = await $fetch<ListResponse<T>>(`/api${endpoint}`, {
      method: 'GET',
      params: {
        pageSize: 100,
        is_active: true,
        lang: locale,
      },
    })
    const rows = extractItems<T>(response)

    return rows.map((item) => ({
      label: item.name ?? item.title ?? item.code ?? `#${item.id}`,
      value: item.id,
    }))
      .filter((option) => option.label && option.value !== undefined)
  } catch (error) {
    const { $logger } = useNuxtApp() as { $logger: { warn: (msg: string, meta?: unknown) => void } }
    $logger.warn(`[useEntityRelations] Failed to fetch ${endpoint}`, error)
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
      fetchRelation<Arcana>('/arcana', lang),
      fetchRelation<CardTypeSchema>('/card_type', lang),
      fetchRelation<FacetSchema>('/facet', lang),
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
