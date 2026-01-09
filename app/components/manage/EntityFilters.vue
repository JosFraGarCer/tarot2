<!-- app/components/manage/EntityFilters.vue -->
<!-- eslint-disable vue/no-mutating-props -->
<template>
  <div class="flex flex-col gap-3">
    <!-- Filters Row -->
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
      <USelectMenu
        v-if="show.tags"
        v-model="tagValue"
        :items="tagOptions"
        multiple
        size="sm"
        value-key="id"
        class="w-40 lg:w-48"
        :placeholder="tagsPlaceholder"
        :ui="{ base: 'rounded-xl' }"
      />

      <USelectMenu
        v-if="show.facet"
        v-model="facetValue"
        :items="facetOptions"
        multiple
        size="sm"
        value-key="id"
        class="w-36 lg:w-40"
        :placeholder="facetPlaceholder"
        :ui="{ base: 'rounded-xl' }"
      />

      <USelectMenu
        v-if="show.type"
        v-model="typeValue"
        :items="typeOptions"
        multiple
        size="sm"
        value-key="id"
        class="w-36 lg:w-40"
        :placeholder="typePlaceholder"
        :ui="{ base: 'rounded-xl' }"
      />

      <USelectMenu
        v-if="show.status"
        v-model="statusValue"
        :items="statusOptions"
        size="sm"
        value-key="value"
        class="w-32 lg:w-36"
        :placeholder="statusPlaceholder"
        :ui="{ base: 'rounded-xl' }"
      />

      <USelectMenu
        v-if="show.is_active"
        v-model="isActiveValue"
        :items="isActiveOptions"
        size="sm"
        value-key="value"
        class="w-32 lg:w-36"
        :placeholder="activePlaceholder"
        :ui="{ base: 'rounded-xl' }"
      />

      <USelectMenu
        v-if="show.parent"
        v-model="parentValue"
        :items="parentOptions"
        size="sm"
        value-key="id"
        class="w-36 lg:w-40"
        :placeholder="parentPlaceholder"
        :ui="{ base: 'rounded-xl' }"
      />

      <UButton
        variant="ghost"
        color="neutral"
        icon="i-heroicons-funnel"
        size="sm"
        class="rounded-xl shrink-0"
        @click="ctx.resetFilters()"
      >
        <template #trailing>
          <UIcon name="i-heroicons-x-mark" class="size-3 -ml-1 opacity-50" />
        </template>
        {{ t('ui.actions.resetFilters') }}
      </UButton>
    </div>

    <!-- Active Filter Badges (Senior Suggestion) -->
    <div v-if="hasActiveFilters" class="flex flex-wrap items-center gap-2">
      <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mr-1">Filtros activos:</span>
      <template v-for="badge in activeFilterBadges" :key="badge.key">
        <UBadge
          size="xs"
          variant="soft"
          color="primary"
          class="rounded-lg pl-2 pr-1 py-0.5 flex items-center gap-1"
        >
          {{ badge.label }}
          <UButton
            icon="i-heroicons-x-mark"
            size="xs"
            color="primary"
            variant="ghost"
            class="rounded-full h-4 w-4 p-0"
            @click="badge.onRemove()"
          />
        </UBadge>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable vue/no-mutating-props -- crud.filters is a shared reactive object */
import { computed, ref, watch } from 'vue'
import { useI18n } from '#imports'
import { useEntityBase } from '~/composables/manage/useEntityBaseContext'
import { useCardStatus } from '~/utils/status'
import { useFilterOptions } from '~/composables/manage/useFilterOptions'
import type { EntityFilterConfig } from '~/composables/manage/useEntity'

const ctx = useEntityBase()
const { t, locale } = useI18n()
const localeValue = computed(() => (typeof locale === 'string' ? locale : locale.value) as string)
const statusUtil = useCardStatus()

const activeConfig = computed<EntityFilterConfig>(() => ctx.filtersConfig.value)

const allowTags = computed(() => ctx.noTags.value !== true)
const allowCardType = computed(() => ctx.cardType.value !== false)

type FilterKey = 'search' | 'tags' | 'facet' | 'type' | 'status' | 'is_active' | 'parent'

function resolveKey(name: FilterKey): string {
  const raw = activeConfig.value?.[name]
  if (typeof raw === 'string' && raw.length) return raw
  if (raw === true) return name
  if (name === 'is_active') {
    const legacy = (activeConfig.value as Record<string, unknown>)?.isActive
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
    is_active: Boolean(activeConfig.value?.is_active ?? (activeConfig.value as Record<string, unknown>)?.isActive),
    parent: Boolean(activeConfig.value?.parent ?? activeConfig.value?.parent_id),
  }
})

interface FilterBindingOptions {
  multi?: boolean
  coerce?: (value: unknown) => unknown
  normalize?: (value: unknown) => unknown
}

function normalizeArrayValue(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (raw === null || raw === undefined) return []
  return [raw]
}

function coerceArrayIds(list: unknown[]): number[] {
  return list
    .map((item) => {
      if (item === null || item === undefined) return undefined
      if (typeof item === 'object') {
        const candidate = (item as Record<string, unknown>).value ?? (item as Record<string, unknown>).id
        if (candidate === null || candidate === undefined) return undefined
        return candidate
      }
      return item
    })
    .map((v) => (typeof v === 'string' && v !== '' ? Number(v) : v))
    .map((v) => (typeof v === 'number' && Number.isFinite(v) ? v : (typeof v === 'string' ? Number(v) : v)))
    .filter((v) => typeof v === 'number' && Number.isFinite(v)) as number[]
}

function coerceSingleId(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const v = value as Record<string, unknown> | unknown
  const candidate = typeof v === 'object' && v !== null ? (v as Record<string, unknown>)?.value ?? (v as Record<string, unknown>)?.id : v
  const num = Number(candidate)
  return Number.isFinite(num) ? num : null
}

function coerceBoolean(value: unknown) {
  if (value === null || value === undefined || value === '' || value === 'all') return null
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return null
}

function useFilterBinding(keyRef: { value: string }, options: FilterBindingOptions = {}) {
  const { multi = false, coerce, normalize } = options
  return computed({
    get() {
      const key = keyRef.value
      if (!key) return multi ? [] : null
      const raw = ctx.crud.filters?.[key]
      
      if (multi) {
        const arr = normalizeArrayValue(raw)
        return normalize ? normalize(arr) : arr
      }
      const value = raw ?? null
      return normalize ? normalize(value) : value
    },
    set(value: unknown) {
      const key = keyRef.value
      if (!key || !ctx.crud.filters) return
      const mapped = (() => {
        if (multi) {
          const arr = normalizeArrayValue(value)
          return coerce ? coerce(arr) : arr
        }
        return coerce ? coerce(value) : value
      })()
      ctx.crud.filters[key] = mapped
    }
  })
}

const tagValue = useFilterBinding(tagsKey, {
  multi: true,
  coerce: (value: unknown) => coerceArrayIds(value as unknown[]),
})

const facetValue = useFilterBinding(facetKey, {
  multi: true,
  coerce: (value: unknown) => coerceArrayIds(value as unknown[]),
})

const typeIsRole = computed(() => typeKey.value?.includes('role'))

const typeValue = computed({
  get() {
    const key = typeKey.value
    if (!key) return typeIsRole.value ? null : []
    const raw = ctx.crud.filters?.[key]
    if (typeIsRole.value) {
      return raw ?? null
    }
    return normalizeArrayValue(raw)
  },
  set(value: unknown) {
    const key = typeKey.value
    if (!key || !ctx.crud.filters) return
    if (typeIsRole.value) {
      ctx.crud.filters[key] = coerceSingleId(value)
      return
    }
    const arr = normalizeArrayValue(value)
    ctx.crud.filters[key] = coerceArrayIds(arr)
  }
})

const statusValue = useFilterBinding(statusKey)
const isActiveValue = useFilterBinding(isActiveKey, {
  coerce: coerceBoolean,
  normalize: (value: unknown) => {
    if (value === true) return 'true'
    if (value === false) return 'false'
    return 'all'
  },
})

const parentValue = useFilterBinding(parentKey, {
  coerce: coerceSingleId,
  normalize: (value: unknown) => (value === undefined ? null : value),
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

const tagsLoaded = ref(false)
const cardTypesLoaded = ref(false)
const rolesLoaded = ref(false)
const arcanaLoaded = ref(false)
const facetsLoaded = ref(false)
const parentLoaded = ref(false)

const {
  fetchTags,
  fetchCardTypes,
  fetchRoles,
  fetchArcana,
  fetchFacets,
  fetchParentTags,
  tagOptions,
  cardTypeOptions,
  roleOptions,
  arcanaOptions,
  facetOptionsRaw,
  parentOptions,
} = useFilterOptions(() => localeValue.value)

const loadNeededOptions = () => {
  if (show.value.tags && !tagsLoaded.value) {
    tagsLoaded.value = true
    fetchTags()
  }
  if (show.value.type) {
    if (typeIsRole.value) {
      if (!rolesLoaded.value) {
        rolesLoaded.value = true
        fetchRoles()
      }
    } else if (!cardTypesLoaded.value) {
      cardTypesLoaded.value = true
      fetchCardTypes()
    }
  }
  const fKey = facetKey.value
  if (show.value.facet && fKey) {
    if (fKey.includes('arcana') && !arcanaLoaded.value) {
      arcanaLoaded.value = true
      fetchArcana()
    } else if (fKey.includes('facet') && !facetsLoaded.value) {
      facetsLoaded.value = true
      fetchFacets()
    }
  }
  if (show.value.parent && !parentLoaded.value) {
    parentLoaded.value = true
    fetchParentTags()
  }
}

watch([show, facetKey, typeIsRole], loadNeededOptions, { immediate: true })

const typeOptions = computed(() => {
  const key = typeKey.value || ''
  if (key.includes('role')) {
    return roleOptions.value
  }
  return cardTypeOptions.value
})

const facetOptions = computed(() => {
  const key = facetKey.value
  if (key.includes('arcana')) {
    return arcanaOptions.value
  }
  if (key.includes('facet')) {
    return facetOptionsRaw.value
  }
  return []
})

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

const hasActiveFilters = computed(() => {
  if (!ctx.crud?.filters) return false
  return Object.entries(ctx.crud.filters).some(([key, value]) => {
    if (key === 'search') return false
    if (Array.isArray(value)) return value.length > 0
    return value !== null && value !== undefined && value !== '' && value !== 'all'
  })
})

const activeFilterBadges = computed(() => {
  const badges: Array<{ key: string; label: string; onRemove: () => void }> = []
  
  if (show.value.tags && tagValue.value && Array.isArray(tagValue.value) && tagValue.value.length) {
    badges.push({
      key: 'tags',
      label: `${t('ui.fields.tags')}: ${tagValue.value.length}`,
      onRemove: () => { tagValue.value = [] }
    })
  }
  
  if (show.value.facet && facetValue.value && Array.isArray(facetValue.value) && facetValue.value.length) {
    badges.push({
      key: 'facet',
      label: `${facetPlaceholder.value}: ${facetValue.value.length}`,
      onRemove: () => { facetValue.value = [] }
    })
  }

  if (show.value.status && statusValue.value) {
    const opt = statusOptions.value.find(o => o.value === statusValue.value)
    if (opt && opt.value !== null) {
      badges.push({
        key: 'status',
        label: `${t('ui.fields.status')}: ${opt.label}`,
        onRemove: () => { statusValue.value = null }
      })
    }
  }

  if (show.value.is_active && isActiveValue.value !== 'all') {
    const opt = isActiveOptions.value.find(o => o.value === isActiveValue.value)
    if (opt) {
      badges.push({
        key: 'is_active',
        label: opt.label,
        onRemove: () => { isActiveValue.value = 'all' }
      })
    }
  }

  return badges
})

</script>