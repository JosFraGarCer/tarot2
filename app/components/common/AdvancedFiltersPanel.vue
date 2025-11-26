<!-- app/components/common/AdvancedFiltersPanel.vue -->
<template>
  <UCollapsible
    class="advanced-filters-panel flex flex-col gap-3"
    :open="openInternal"
    @update:open="handleOpenChange"
  >
    <template #default="{ open: isOpen }">
      <slot name="trigger" :open="isOpen" :filters="exposedState" />
    </template>

    <template #content>
      <UForm :state="state" class="space-y-4" @submit.prevent="handleApply">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="field in schema"
            :key="field.key"
            class="flex flex-col gap-1 text-sm"
          >
            <label class="font-medium text-neutral-600 dark:text-neutral-300">
              {{ field.label }}
            </label>

            <UInput
              v-if="field.type === 'text'"
              v-model="state[field.key]"
              size="sm"
              :placeholder="field.placeholder"
              :clearable="field.clearable"
            />

            <USelectMenu
              v-else-if="field.type === 'select'"
              v-model="state[field.key]"
              size="sm"
              :items="field.options"
              option-attribute="label"
              value-key="value"
              :clearable="field.clearable ?? true"
            />

            <USelectMenu
              v-else-if="field.type === 'multi-select' || field.type === 'tags'"
              v-model="state[field.key]"
              size="sm"
              multiple
              searchable
              :items="field.options"
              option-attribute="label"
              value-key="value"
              :clearable="field.clearable ?? true"
            />

            <div v-else-if="field.type === 'toggle'" class="flex items-center gap-2">
              <USwitch v-model="state[field.key]" size="sm" />
              <span class="text-neutral-600 dark:text-neutral-300">{{ field.placeholder || field.label }}</span>
            </div>

            <div v-else-if="field.type === 'range'" class="flex items-center gap-2">
              <UInput
                v-model="state[field.key].min"
                size="sm"
                type="text"
                :placeholder="field.minLabel ?? 'Min'"
              />
              <span class="text-xs text-neutral-400">—</span>
              <UInput
                v-model="state[field.key].max"
                size="sm"
                type="text"
                :placeholder="field.maxLabel ?? 'Max'"
              />
            </div>

            <div v-else-if="field.type === 'date-range'" class="flex flex-col gap-2">
              <ClientOnly>
                <UPopover :popper="{ placement: 'bottom-start' }">
                  <UButton
                    block
                    size="sm"
                    variant="outline"
                    color="neutral"
                    icon="i-heroicons-calendar-days-20-solid"
                    class="justify-between"
                  >
                    <span class="truncate">{{ dateRangeLabel(field) }}</span>
                  </UButton>
                  <template #panel="{ close }">
                    <div class="p-3 space-y-2">
                      <UCalendar
                        v-model="state[field.key]"
                        range
                        :columns="field.numberOfMonths ?? 1"
                        @update:model-value="value => onDateRangeUpdate(field.key, value, close)"
                      />
                      <div class="flex justify-end">
                        <UButton size="xs" variant="ghost" color="neutral" @click="() => { state[field.key] = null; close?.() }">
                          {{ tt('ui.actions.clear', 'Clear') }}
                        </UButton>
                      </div>
                    </div>
                  </template>
                </UPopover>
              </ClientOnly>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
          <USwitch
            v-if="showAutoApply"
            v-model="autoApplyEnabled"
            size="sm"
            :label="tt('ui.filters.autoApply', 'Auto apply')"
          />

          <div class="ml-auto flex items-center gap-2">
            <UButton
              size="sm"
              variant="soft"
              color="neutral"
              :label="resetLabel"
              @click.prevent="handleReset"
            />
            <UButton
              size="sm"
              color="primary"
              :label="applyLabel"
              :disabled="autoApplyEnabled"
              type="submit"
            />
          </div>
        </div>
      </UForm>
    </template>
  </UCollapsible>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { useI18n } from '#imports'
import { useQuerySync } from '~/composables/common/useQuerySync'

type Scalar = string | number | boolean | null | undefined
type FilterType = 'text' | 'select' | 'multi-select' | 'range' | 'tags' | 'toggle' | 'date-range'

interface BaseFilterDefinition<TType extends FilterType = FilterType, TValue = any> {
  key: string
  label: string
  type: TType
  placeholder?: string
  default?: TValue
  queryKey?: string
  clearable?: boolean
}

interface OptionDefinition {
  label: string
  value: Scalar
}

interface TextFilterDefinition extends BaseFilterDefinition<'text', string | null> { type: 'text' }
interface ToggleFilterDefinition extends BaseFilterDefinition<'toggle', boolean> { type: 'toggle' }
interface SelectFilterDefinition extends BaseFilterDefinition<'select', Scalar> { type: 'select'; options: OptionDefinition[] }
interface MultiSelectFilterDefinition extends BaseFilterDefinition<'multi-select', Scalar[]> { type: 'multi-select'; options: OptionDefinition[] }
interface TagsFilterDefinition extends BaseFilterDefinition<'tags', Scalar[]> { type: 'tags'; options: OptionDefinition[] }
interface RangeFilterDefinition
  extends BaseFilterDefinition<'range', { min: Scalar; max: Scalar }>
{ type: 'range'; minLabel?: string; maxLabel?: string }

interface DateRangeFilterDefinition
  extends BaseFilterDefinition<'date-range', [Date | string | null, Date | string | null] | null>
{ type: 'date-range'; placeholder?: string; numberOfMonths?: number }

export type FilterDefinition =
  | TextFilterDefinition
  | ToggleFilterDefinition
  | SelectFilterDefinition
  | MultiSelectFilterDefinition
  | TagsFilterDefinition
  | RangeFilterDefinition
  | DateRangeFilterDefinition

const props = withDefaults(
  defineProps<{
    schema: FilterDefinition[]
    modelValue?: Record<string, any>
    open?: boolean
    autoApply?: boolean
    syncWithRoute?: boolean
    applyLabel?: string
    resetLabel?: string
  }>(),
  {
    modelValue: () => ({}),
    open: false,
    autoApply: false,
    syncWithRoute: true,
    applyLabel: 'Apply',
    resetLabel: 'Reset',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'apply', value: Record<string, any>): void
  (e: 'reset'): void
  (e: 'update:open', value: boolean): void
}>()

const { t } = useI18n()

function tt(key: string, fallback: string) {
  const translated = t(key)
  return translated === key ? fallback : (translated as string)
}

function defaultValue(field: FilterDefinition) {
  if (field.default !== undefined) return field.default
  switch (field.type) {
    case 'multi-select':
    case 'tags':
      return []
    case 'range':
      return { min: null, max: null }
    case 'date-range':
      return null
    case 'toggle':
      return false
    default:
      return null
  }
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) return [...value] as T
  if (value && typeof value === 'object') return { ...(value as Record<string, any>) } as T
  return (value ?? null) as T
}

const defaults = computed<Record<string, any>>(() => {
  const base: Record<string, any> = {}
  for (const field of props.schema) {
    base[field.key] = cloneValue(props.modelValue?.[field.key] ?? defaultValue(field))
  }
  return base
})

const queryKeyMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const field of props.schema) {
    map[field.key] = field.queryKey ?? field.key
  }
  return map
})

const parseMap = computed<Partial<Record<string, (value: Scalar | Scalar[] | null | undefined) => any>>>(() => {
  const map: Partial<Record<string, (value: Scalar | Scalar[] | null | undefined) => any>> = {}
  for (const field of props.schema) {
    const fallback = defaults.value[field.key]
    switch (field.type) {
      case 'text':
      case 'select':
        map[field.key] = (value) => (typeof value === 'string' ? value : fallback)
        break
      case 'toggle':
        map[field.key] = (value) => value === 'true' || value === true
        break
      case 'multi-select':
      case 'tags':
        map[field.key] = (value) => {
          if (Array.isArray(value)) return value
          if (typeof value === 'string' && value.length) return value.split(',')
          return Array.isArray(fallback) ? fallback : []
        }
        break
      case 'date-range':
        map[field.key] = (value) => {
          if (Array.isArray(value) && value.length === 2) return normalizeDateTuple(value)
          if (value && typeof value === 'string' && value.includes(',')) return normalizeDateTuple(value.split(',').slice(0, 2))
          return fallback ?? null
        }
        break
      default:
        break
    }
  }
  return map
})

const serializeMap = computed<Partial<Record<string, (value: any) => Scalar | Scalar[] | null | undefined>>>(() => {
  const map: Partial<Record<string, (value: any) => Scalar | Scalar[] | null | undefined>> = {}
  for (const field of props.schema) {
    if (field.type === 'range') {
      map[field.key] = () => undefined
    }
    if (field.type === 'date-range') {
      map[field.key] = () => undefined
    }
  }
  return map
})

const syncing = ref(false)
const state = reactive<Record<string, any>>({ ...defaults.value })

const querySync = props.syncWithRoute
  ? useQuerySync(() => ({
      defaults: defaults.value,
      parse: parseMap.value,
      serialize: serializeMap.value,
      queryKeyMap: queryKeyMap.value,
      parseState: (query, baseDefaults) => parseRangeState(query, baseDefaults),
      serializeState: (current, baseDefaults) => serializeRangeState(current, baseDefaults),
      replace: true,
    }))
  : null

if (querySync) {
  watchEffect(() => {
    syncing.value = true
    const source = querySync.state
    for (const field of props.schema) {
      state[field.key] = cloneValue(source[field.key] ?? defaults.value[field.key])
    }
    syncing.value = false
  })
} else {
  watch(defaults, (next) => {
    syncing.value = true
    for (const field of props.schema) {
      state[field.key] = cloneValue(next[field.key])
    }
    syncing.value = false
  }, { deep: true, immediate: true })
}

watch(() => props.modelValue, (value) => {
  if (!value) return
  syncing.value = true
  for (const field of props.schema) {
    state[field.key] = cloneValue(value[field.key] ?? defaults.value[field.key])
  }
  syncing.value = false
}, { deep: true })

const openInternal = computed({
  get: () => Boolean(props.open),
  set: (value: boolean) => emit('update:open', value),
})

const applyLabel = computed(() => tt(props.applyLabel ?? 'Apply', 'Apply'))
const resetLabel = computed(() => tt(props.resetLabel ?? 'Reset', 'Reset'))

const showAutoApply = computed(() => props.autoApply !== null && props.autoApply !== undefined)
const autoApplyEnabled = ref(Boolean(props.autoApply))

watch(() => props.autoApply, (value) => {
  if (value === undefined || value === null) return
  autoApplyEnabled.value = Boolean(value)
})

const exposedState = computed(() => ({ ...state }))

const dateRangeLabel = (field: DateRangeFilterDefinition) => {
  const value = state[field.key] as [Date | string | null, Date | string | null] | null
  const placeholder = field.placeholder ?? tt('ui.filters.anyDate', 'Any date')
  return formatDateRangeLabel(value, placeholder)
}

const onDateRangeUpdate = (key: string, value: [Date | string | null, Date | string | null] | null, close?: () => void) => {
  state[key] = value
  if (value && value[0] && value[1]) close?.()
}

watch(state, (next) => {
  if (syncing.value) return
  emit('update:modelValue', { ...next })
  if (autoApplyEnabled.value) void handleApply()
}, { deep: true })

watch(autoApplyEnabled, (enabled) => {
  if (enabled) void handleApply()
})

async function handleApply() {
  const payload = { ...state }
  emit('apply', payload)
  if (querySync) {
    await querySync.update(payload)
  }
}

async function handleReset() {
  syncing.value = true
  for (const field of props.schema) {
    state[field.key] = cloneValue(defaults.value[field.key])
  }
  syncing.value = false
  emit('reset')
  if (querySync) {
    await querySync.reset()
  }
}

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}

function parseRangeState(query: Record<string, any>, baseDefaults: Record<string, any>) {
  const next: Record<string, any> = {}
  for (const field of props.schema) {
    if (field.type !== 'range') continue
    const key = field.queryKey ?? field.key
    const base = baseDefaults[field.key] ?? { min: null, max: null }
    const raw = query[key]
    let min = raw && typeof raw === 'object' ? (raw as any).min : undefined
    let max = raw && typeof raw === 'object' ? (raw as any).max : undefined
    if (query[`${key}_min`] !== undefined) min = query[`${key}_min`]
    if (query[`${key}_max`] !== undefined) max = query[`${key}_max`]
    next[field.key] = {
      min: coerceRangeValue(min, base.min ?? null),
      max: coerceRangeValue(max, base.max ?? null),
    }
  }
  return next
}

function serializeRangeState(state: Record<string, any>, baseDefaults: Record<string, any>) {
  const query: Record<string, string | undefined> = {}
  for (const field of props.schema) {
    if (field.type !== 'range') continue
    const key = field.queryKey ?? field.key
    const current = state[field.key] ?? {}
    const base = baseDefaults[field.key] ?? { min: null, max: null }
    const currentMin = current?.min ?? null
    const currentMax = current?.max ?? null
    const baseMin = base?.min ?? null
    const baseMax = base?.max ?? null

    if (!valuesEqual(currentMin, baseMin) && !isEmptyValue(currentMin)) {
      query[`${key}_min`] = formatRouteValue(currentMin)
    }
    if (!valuesEqual(currentMax, baseMax) && !isEmptyValue(currentMax)) {
      query[`${key}_max`] = formatRouteValue(currentMax)
    }
  }
  return query
}

function coerceRangeValue(value: any, fallback: any) {
  if (value == null || value === '') return fallback ?? null
  if (Array.isArray(value)) return value.length ? value[0] : fallback ?? null
  if (typeof fallback === 'number') {
    const num = Number(value)
    return Number.isFinite(num) ? num : fallback ?? null
  }
  return value
}

function valuesEqual(a: any, b: any) {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  return a === b
}

function isEmptyValue(value: any) {
  return value == null || value === ''
}

function formatRouteValue(value: any) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : undefined
  return value
}

function normalizeDateTuple(value: Array<Date | string | null>): [Date | string | null, Date | string | null] | null {
  if (!value || value.length < 2) return null
  const [start, end] = value
  if (!start && !end) return null
  return [start ?? null, end ?? null]
}

function formatDateRangeLabel(value: [Date | string | null, Date | string | null] | null, placeholder: string) {
  if (!value || !value[0] || !value[1]) return placeholder
  const formatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  const start = new Date(value[0] as any)
  const end = new Date(value[1] as any)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return placeholder
  return `${formatter.format(start)} – ${formatter.format(end)}`
}
</script>

<style scoped>
.advanced-filters-panel :deep(.u-select-menu) {
  min-width: 12rem;
}
</style>
