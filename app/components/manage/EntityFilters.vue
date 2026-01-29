<!-- app/components/manage/EntityFilters.vue -->
<!-- /app/components/manage/filters/ManageEntityFilters.vue -->
<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <UInput
          v-model="crud.filters.search"
          size="xs"
          :placeholder="t('ui.actions.search')"
          class="w-56"
          icon="i-heroicons-magnifying-glass-20-solid"
        />

        <USelectMenu
          v-if="show.tags"
          v-model="tagValue"
          :items="tagOptions"
          multiple
          size="xs"
          value-key="value"
          class="w-56"
          :placeholder="tagsPlaceholder"
        />
        <USelectMenu
          v-if="show.facet"
          v-model="facetValue"
          :items="facetOptions"
          multiple
          size="xs"
          value-key="value"
          class="w-40"
          :placeholder="facetPlaceholder"
        />
        <USelectMenu
          v-if="show.type"
          v-model="typeValue"
          :items="typeOptions"
          multiple
          size="xs"
          value-key="value"
          class="w-40"
          :placeholder="typePlaceholder"
        />
        <USelectMenu
          v-if="show.status"
          v-model="statusValue"
          :items="statusOptions"
          size="xs"
          value-key="value"
          class="w-40"
          :placeholder="statusPlaceholder"
        />
        <USelectMenu
          v-if="show.is_active"
          v-model="isActiveValue"
          :items="isActiveOptions"
          size="xs"
          value-key="value"
          option-attribute="label"
          class="w-40"
          :placeholder="activePlaceholder"
        />
        <USelectMenu
          v-if="show.parent"
          v-model="parentValue"
          :items="parentOptions"
          size="xs"
          value-key="value"
          class="w-40"
          :placeholder="parentPlaceholder"
        />
      </div>

      <div v-can.disable="['canEditContent','canPublish']" class="flex items-center gap-2">
        <UButton
          icon="i-heroicons-plus-20-solid"
          size="md"
          color="primary"
          :label="`${t('ui.actions.create')} ${label}`"
          @click="onCreate?.()"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n, useLazyAsyncData } from '#imports'
import { useApiFetch } from '~/utils/fetcher'
import { useCardStatus } from '~/utils/status'
import type { ManageCrud } from '@/types/manage'
import type { EntityFilterConfig } from '~/composables/manage/useEntity'
import { useEntityCapabilities } from '~/composables/common/useEntityCapabilities'

type FilterKey = 'search' | 'tags' | 'facet' | 'type' | 'status' | 'is_active' | 'parent'

const props = withDefaults(defineProps<{
  crud: ManageCrud
  config?: EntityFilterConfig
  label: string
  noTags?: boolean
  cardType?: boolean
  onCreate?: () => void
}>(), {
  noTags: false,
  cardType: false,
  onCreate: undefined
})

const { t, locale } = useI18n()
const localeValue = computed(() => (typeof locale === 'string' ? locale : locale.value) as string)
const statusUtil = useCardStatus()
const capabilities = useEntityCapabilities()

const activeConfig = computed<EntityFilterConfig>(() => props.config ?? props.crud.filterConfig)

const allowTags = computed(() => {
  if (props.noTags === true) return false
  if (props.noTags === false) return true
  return capabilities.value.hasTags !== false
})

const allowCardType = computed(() => {
  if (props.cardType !== undefined) return Boolean(props.cardType)
  const cap = capabilities.value.cardType
  return cap === undefined ? true : Boolean(cap)
})

function resolveKey(name: FilterKey): string {
  const config = activeConfig.value
  if (!config) return name
  const raw = config[name]
  if (typeof raw === 'string' && raw.length) return raw
  if (raw === true) return name
  if (name === 'is_active') {
    const legacy = (config as any)?.isActive
    if (legacy) return 'is_active'
  }
  return name
}

const tagsKey = computed(() => resolveKey('tags'))
const facetKey = computed(() => resolveKey('facet'))
const typeKey = computed(() => resolveKey('type'))
const statusKey = computed(() => resolveKey('status'))
const isActiveKey = computed(() => resolveKey('is_active'))
const parentKey = computed(() => resolveKey('parent'))

const show = computed(() => {
  const typeEnabled = Boolean(activeConfig.value?.type)
  const typeKeyValue = typeKey.value

  return {
    search: Boolean(activeConfig.value?.search),
    tags: allowTags.value && Boolean(activeConfig.value?.tags),
    facet: Boolean(activeConfig.value?.facet),
    type: typeEnabled && (typeKeyValue?.includes?.('card_type') ? allowCardType.value : true),
    status: Boolean(activeConfig.value?.status),
    is_active: Boolean(activeConfig.value?.is_active ?? (activeConfig.value as any)?.isActive),
    parent: Boolean(activeConfig.value?.parent ?? activeConfig.value?.parent_id),
  }
})

interface FilterBindingOptions {
  multi?: boolean
  coerce?: (value: any) => any
  normalize?: (value: any) => any
}

function normalizeArrayValue(raw: any): any[] {
  if (Array.isArray(raw)) return raw
  if (raw === null || raw === undefined) return []
  return [raw]
}

function coerceArrayIds(list: any[]): number[] {
  return list
    .map((item) => {
      if (item === null || item === undefined) return undefined
      if (typeof item === 'object') {
        const candidate = (item as any).value ?? (item as any).id
        if (candidate === null || candidate === undefined) return undefined
        return candidate
      }
      return item
    })
    .map((v) => {
      if (typeof v === 'number' && Number.isFinite(v)) return v
      if (typeof v === 'string' && v !== '') {
        const num = Number(v)
        return Number.isFinite(num) ? num : undefined
      }
      return undefined
    })
    .filter((v): v is number => v !== undefined) as number[]
}

function coerceSingleId(value: any) {
  if (value === null || value === undefined || value === '') return null
  const candidate = typeof value === 'object' ? (value?.value ?? value?.id) : value
  const num = Number(candidate)
  return Number.isFinite(num) ? num : null
}

function coerceBoolean(value: any) {
  if (value === null || value === undefined || value === '' || value === 'all') return null
  // Extraer valor si es un objeto { label, value }
  const candidate = typeof value === 'object' ? (value?.value ?? value?.id) : value
  if (candidate === true || candidate === 'true') return true
  if (candidate === false || candidate === 'false') return false
  return null
}

function useFilterBinding(keyRef: { value: string }, options: FilterBindingOptions = {}) {
  const { multi = false, coerce, normalize } = options
  return computed({
    get() {
      const key = keyRef.value
      if (!key) return multi ? [] : null
      const raw = props.crud.filters?.[key]
      
      
      
      if (multi) {
        const arr = normalizeArrayValue(raw)
        return normalize ? normalize(arr) : arr
      }
      const value = raw ?? null
      return normalize ? normalize(value) : value
    },
    set(value: any) {
      const key = keyRef.value
      if (!key || !props.crud.filters) return
      const mapped = (() => {
        if (multi) {
          const arr = normalizeArrayValue(value)
          return coerce ? coerce(arr) : arr
        }
        return coerce ? coerce(value) : value
      })()
      props.crud.filters[key] = mapped
    }
  })
}

const tagValue = useFilterBinding(tagsKey, {
  multi: true,
  coerce: (value: any[]) => coerceArrayIds(value),
})

const facetValue = useFilterBinding(facetKey, {
  multi: true,
  coerce: (value: any[]) => coerceArrayIds(value),
})

const typeIsRole = computed(() => typeKey.value?.includes('role'))

const typeValue = computed({
  get() {
    const key = typeKey.value
    if (!key) return typeIsRole.value ? null : []
    const raw = props.crud.filters?.[key]
    if (typeIsRole.value) {
      return raw ?? null
    }
    return normalizeArrayValue(raw)
  },
  set(value: any) {
    const key = typeKey.value
    if (!key || !props.crud.filters) return
    if (typeIsRole.value) {
      props.crud.filters[key] = coerceSingleId(value)
      return
    }
    const arr = normalizeArrayValue(value)
    props.crud.filters[key] = coerceArrayIds(arr)
  }
})

const statusValue = useFilterBinding(statusKey)
const isActiveValue = computed({
  get() {
    const key = isActiveKey.value
    if (!key) return null
    const raw = props.crud.filters?.[key]
    // Encontrar el objeto correspondiente en isActiveOptions
    const options = isActiveOptions.value
    const stringValue = raw === true || raw === 'true' ? 'true' : raw === false || raw === 'false' ? 'false' : 'all'
    return options.find(opt => opt.value === stringValue) || null
  },
  set(value: any) {
    const key = isActiveKey.value
    if (!key || !props.crud.filters) return
    // value viene como objeto { label, value } de USelectMenu
    const candidate = typeof value === 'object' ? (value?.value ?? value?.id) : value
    if (candidate === true || candidate === 'true') {
      props.crud.filters[key] = true
    } else if (candidate === false || candidate === 'false') {
      props.crud.filters[key] = false
    } else {
      props.crud.filters[key] = null
    }
  }
})

const parentValue = useFilterBinding(parentKey, {
  coerce: coerceSingleId,
  normalize: (value: any) => (value === undefined ? null : value),
})

const isActiveOptions = computed(() => ([
  { label: t('ui.filters.all'), value: 'all' },
  { label: t('ui.states.active'), value: 'true' },
  { label: t('ui.states.inactive'), value: 'false' }
]))

const statusOptions = computed(() => (
  [
    { label: t('ui.filters.all'), value: null },
    ...statusUtil.options().map(option => ({
      label: t(option.labelKey),
      value: option.value,
    }))
  ]
))

function unwrapRows(raw: any): any[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw.data)) return raw.data
  if (Array.isArray(raw.results)) return raw.results
  return []
}

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

const tagsLoaded = ref(false)
const cardTypesLoaded = ref(false)
const rolesLoaded = ref(false)
const arcanaLoaded = ref(false)
const facetsLoaded = ref(false)
const parentLoaded = ref(false)
const pendingFetches = new Set<string>()

watch(() => show.value.tags, async (enabled) => {
  if (enabled && !pendingFetches.has('tags')) {
    pendingFetches.add('tags')
    tagsLoaded.value = true
    await fetchTags()
    pendingFetches.delete('tags')
  }
}, { immediate: true })

watch(() => show.value.type, async (enabled) => {
  if (!enabled) return
  if (typeIsRole.value) {
    if (!pendingFetches.has('roles')) {
      pendingFetches.add('roles')
      rolesLoaded.value = true
      await fetchRoles()
      pendingFetches.delete('roles')
    }
    return
  }
  if (!pendingFetches.has('cardTypes')) {
    pendingFetches.add('cardTypes')
    cardTypesLoaded.value = true
    await fetchCardTypes()
    pendingFetches.delete('cardTypes')
  }
}, { immediate: true })

watch(() => ({ enabled: show.value.facet, key: facetKey.value }), async ({ enabled, key }) => {
  if (!enabled || !key) return
  if (key.includes('arcana') && !pendingFetches.has('arcana')) {
    pendingFetches.add('arcana')
    arcanaLoaded.value = true
    await fetchArcana()
    pendingFetches.delete('arcana')
  }
  else if (key.includes('facet') && !pendingFetches.has('facets')) {
    pendingFetches.add('facets')
    facetsLoaded.value = true
    await fetchFacets()
    pendingFetches.delete('facets')
  }
}, { immediate: true })

watch(() => show.value.parent, async (enabled) => {
  if (enabled && !pendingFetches.has('parent')) {
    pendingFetches.add('parent')
    parentLoaded.value = true
    await fetchParentTags()
    pendingFetches.delete('parent')
  }
}, { immediate: true })

const tagOptions = computed(() => unwrapRows(tagData.value).map((item: any) => ({
  label: item.name ?? item.code ?? `#${item.id}`,
  value: item.id,
})))

const typeOptions = computed(() => {
  const key = typeKey.value || ''
  if (key.includes('role')) {
    return unwrapRows(roleData.value).map((item: any) => ({
      label: item.name ?? `#${item.id}`,
      value: item.id,
    }))
  }
  return unwrapRows(cardTypeData.value).map((item: any) => ({
    label: item.name ?? item.code ?? `#${item.id}`,
    value: item.id,
  }))
})

const facetOptions = computed(() => {
  const key = facetKey.value
  if (key.includes('arcana')) {
    return unwrapRows(arcanaData.value).map((item: any) => ({
      label: item.name ?? item.code ?? `#${item.id}`,
      value: item.id,
    }))
  }
  if (key.includes('facet')) {
    return unwrapRows(facetData.value).map((item: any) => ({
      label: item.name ?? item.code ?? `#${item.id}`,
      value: item.id,
    }))
  }
  return []
})

const parentOptions = computed(() => unwrapRows(parentData.value).map((item: any) => ({
  label: item.name ?? item.code ?? `#${item.id}`,
  value: item.id,
})))

const facetPlaceholder = computed(() => {
  const key = facetKey.value
  if (key.includes('arcana')) return t('entities.arcana')
  if (key.includes('facet')) return t('entities.facet')
  return t('common.related')
})

const typePlaceholder = computed(() => {
  const key = typeKey.value
  if (key.includes('role')) return t('common.roles')
  if (key.includes('card_type')) return t('entities.cardType')
  if (key.includes('world')) return t('entities.world')
  return t('common.type')
})

const statusPlaceholder = computed(() => t('ui.fields.status'))
const tagsPlaceholder = computed(() => t('ui.fields.tags'))
const activePlaceholder = computed(() => t('ui.states.active'))

const parentPlaceholder = computed(() => t('filters.parent'))
</script>