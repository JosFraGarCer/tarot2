<!-- app/components/common/CommonDataTable.vue -->
<template>
  <div :class="rootClasses">
    <header v-if="showHeader" class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
        <slot name="title">
          <span v-if="title">{{ title }}</span>
        </slot>
        <UBadge v-if="metaState.totalItems != null" size="xs" variant="soft" color="neutral">
          {{ metaState.totalItems }}
        </UBadge>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <slot name="toolbar" :selected="selectedInternal" :meta="metaState" />
        <ClientOnly v-if="showDensityToggle">
          <UFieldGroup
            size="xs"
            orientation="horizontal"
            class="density-toggle"
            :ui="{
              base: 'flex items-center gap-2',
              label: 'text-xs font-medium text-neutral-500 dark:text-neutral-400',
            }"
          >
            <template #label>
              {{ tt('ui.table.densityLabel', 'Density') }}
            </template>
            <div class="flex items-center gap-1">
              <UButton
                v-for="option in densityOptions"
                :key="option.value"
                :label="option.label"
                size="xs"
                :color="densityInternal === option.value ? 'primary' : 'neutral'"
                variant="soft"
                :aria-pressed="densityInternal === option.value"
                @click="setDensity(option.value)"
              />
            </div>
          </UFieldGroup>
        </ClientOnly>
      </div>
    </header>

    <UAlert
      v-if="selectedInternal.length && hasSelectionSlot"
      :title="selectionAlertTitle"
      color="primary"
      variant="soft"
      icon="i-heroicons-check-circle"
      class="mt-3"
    >
      <template #description>
        <slot name="selection" :selected="selectedInternal" />
      </template>
    </UAlert>

    <UTable
      :data="items"
      :columns="resolvedColumns"
      :loading="false"
      :sort="sortInternal"
      :row-attr="rowAttr"
      class="w-full"
      :ui="tableUi"
      @update:sort="handleSort"
      @row-click="row => emit('row:click', row)"
      @row-dblclick="row => emit('row:dblclick', row)"
    >
      <template v-if="selectable" #select-header>
        <UCheckbox v-model="allSelected" :aria-label="tt('ui.table.selectAll', 'Select all')" />
      </template>
      <template v-if="selectable" #select-cell="{ row }">
        <UCheckbox
          :model-value="selectedInternal.includes(rowKeyValue(row.original))"
          :aria-label="tt('ui.table.selectRow', 'Select row')"
          @update:model-value="(value) => toggleRow(row.original, value)"
        />
      </template>

      <!-- Skeleton loading state -->
      <template v-if="loading" #body>
        <tr v-for="i in (metaState.pageSize || 10)" :key="`skeleton-${i}`" class="border-b border-neutral-100 dark:border-neutral-800">
          <td v-if="selectable" class="px-3 py-4">
            <USkeleton class="h-4 w-4" />
          </td>
          <td v-for="col in baseColumns" :key="col.id" class="px-3 py-4">
            <USkeleton class="h-4 w-full max-w-[150px]" />
          </td>
          <td v-if="capabilities.hasStatus" class="px-3 py-4">
            <USkeleton class="h-5 w-20 rounded-full" />
          </td>
          <td v-if="capabilities.translatable" class="px-3 py-4">
            <USkeleton class="h-5 w-24 rounded-full" />
          </td>
          <td v-if="capabilities.i18nHealth" class="px-3 py-4 text-center">
            <div class="flex justify-center gap-1">
              <USkeleton class="h-5 w-6 rounded-sm" />
              <USkeleton class="h-5 w-6 rounded-sm" />
            </div>
          </td>
          <td v-if="capabilities.hasTags" class="px-3 py-4">
             <div class="flex gap-1">
               <USkeleton class="h-5 w-12 rounded-full" />
               <USkeleton class="h-5 w-12 rounded-full" />
             </div>
          </td>
          <td v-if="capabilities.hasRevisions" class="px-3 py-4 text-center">
            <USkeleton class="mx-auto h-4 w-8" />
          </td>
          <td v-if="hasActionsSlot || capabilities.actionsBatch" class="px-3 py-4 text-right">
            <USkeleton class="ml-auto h-8 w-8 rounded-md" />
          </td>
        </tr>
      </template>

      <template
        v-for="column in slotColumns"
        :key="column.key"
        #[column.slotName]="ctx"
      >
        <slot :name="`cell-${column.key}`" v-bind="ctx">
          <template v-if="column.isI18nHealth">
            <div class="flex gap-1">
              <template v-for="lang in ['es', 'en']" :key="lang">
                <UTooltip :text="lang.toUpperCase()">
                  <UBadge
                    size="xs"
                    variant="soft"
                    :color="ctx.row.original?.language_code === lang || (lang === 'en' && ctx.row.original?._isFallback) ? 'success' : 'neutral'"
                    :class="ctx.row.original?.language_code === lang ? 'opacity-100' : 'opacity-40'"
                  >
                    {{ lang.toUpperCase() }}
                  </UBadge>
                </UTooltip>
              </template>
            </div>
          </template>
          <component
            :is="column.component"
            v-else-if="column.component"
            v-bind="buildComponentProps(column, ctx)"
          />
          <span v-else class="block truncate">
            {{ ctx.getValue?.() ?? ctx.row.original?.[column.key] ?? '' }}
          </span>
        </slot>
      </template>

      <template v-if="$slots['row-preview']" #row="{ row }">
        <slot name="row-preview" :row="row.original" />
      </template>

      <template v-if="$slots.empty" #empty>
        <slot name="empty" />
      </template>

      <template v-if="$slots.loading" #loading>
        <slot name="loading" />
      </template>

      <template v-if="$slots.footer" #footer>
        <slot name="footer" :meta="metaState" />
      </template>
    </UTable>

    <PaginationControls
      v-if="showPagination"
      class="mt-4"
      :page="metaState.page"
      :page-size="metaState.pageSize"
      :total-items="metaState.totalItems"
      :total-pages="metaState.totalPages"
      :page-size-items="pageSizeItems"
      @update:page="(page) => emit('update:page', page)"
      @update:page-size="(size) => emit('update:pageSize', size)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, readonly } from 'vue'
import { useSlots, useI18n } from '#imports'
import type { TableColumn } from '@nuxt/ui'
import PaginationControls from '~/components/common/PaginationControls.vue'
import StatusBadge from '~/components/common/StatusBadge.vue'
import { useListMeta, type ListMeta } from '~/composables/common/useListMeta'
import { useEntityCapabilities, type EntityCapabilities } from '~/composables/common/useEntityCapabilities'

// Row data type - generic record with id
export interface TableRowData {
  id?: number | string
  language_code?: string | null
  _isFallback?: boolean
  [key: string]: unknown
}

export interface ColumnDefinition<T = TableRowData> {
  key: string
  label?: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  hidden?: boolean
  capability?: keyof EntityCapabilities | Array<keyof EntityCapabilities>
}

const props = withDefaults(defineProps<{
  items?: TableRowData[]
  columns?: ColumnDefinition[]
  meta?: Partial<ListMeta> | null
  loading?: boolean
  selectable?: boolean
  selectedKeys?: Array<string | number>
  rowKey?: string
  entityKind?: string | null
  capabilities?: Partial<EntityCapabilities> | null
  density?: 'comfortable' | 'regular' | 'compact'
  densityToggle?: boolean
  title?: string
  showToolbar?: boolean
  sort?: { column: string; direction: 'asc' | 'desc' } | null
  pageSizeItems?: Array<{ label: string; value: number }>
}>(), {
  items: () => [],
  columns: () => [],
  selectable: false,
  selectedKeys: () => [],
  rowKey: 'id',
  entityKind: null,
  capabilities: null,
  density: 'regular',
  densityToggle: true,
  title: '',
  showToolbar: true,
  sort: null,
  pageSizeItems: () => [
    { label: '20', value: 20 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
  ],
})

const emit = defineEmits<{
  (e: 'update:selected', value: Array<string | number>): void
  (e: 'update:page', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'update:sort', value: { column: string; direction: 'asc' | 'desc' }): void
  (e: 'row:click', value: TableRowData): void
  (e: 'row:dblclick', value: TableRowData): void
}>()

const slots = useSlots()
const { t } = useI18n()

function tt(key: string, fallback: string): string {
  const translated = t(key) as string
  return translated === key ? fallback : translated
}

const densityInternal = ref(props.density)
watch(() => props.density, (value) => { densityInternal.value = value })

const densityOptions = computed(() => ([
  { label: tt('ui.table.densityComfortable', 'Comfort'), value: 'comfortable' },
  { label: tt('ui.table.densityRegular', 'Regular'), value: 'regular' },
  { label: tt('ui.table.densityCompact', 'Compact'), value: 'compact' },
]))

function setDensity(value: 'comfortable' | 'regular' | 'compact') {
  if (densityInternal.value === value) return
  densityInternal.value = value
}

const items = computed(() => props.items ?? [])

const metaState = useListMeta(
  () => props.meta,
  () => ({
    page: 1,
    pageSize: 20,
    totalItems: items.value.length,
  }),
)

const capabilities = useEntityCapabilities({
  kind: () => props.entityKind ?? null,
  overrides: () => props.capabilities ?? null,
})

const selectable = computed(() => props.selectable || Boolean(capabilities.value.actionsBatch))

const selectedInternal = ref<Array<string | number>>(props.selectedKeys.slice())
watch(() => props.selectedKeys, (value) => {
  if (!value) return
  selectedInternal.value = value.slice()
})

watch(selectedInternal, (value) => emit('update:selected', value), { deep: true })

watch(items, () => {
  if (!selectedInternal.value.length) return
  const validKeys = new Set(items.value.map(rowKeyValue))
  selectedInternal.value = selectedInternal.value.filter(key => validKeys.has(key))
})

const sortInternal = ref<{ column: string; direction: 'asc' | 'desc' } | null>(props.sort)
watch(() => props.sort, (value) => { sortInternal.value = value })

function acceptsCapability(column: ColumnDefinition): boolean {
  if (!column.capability) return true
  const caps = capabilities.value || {}
  return Array.isArray(column.capability)
    ? column.capability.every(cap => caps[cap])
    : Boolean(caps[column.capability])
}

const baseColumns = computed<TableColumn[]>(() => props.columns
  .filter(column => !column.hidden)
  .filter(acceptsCapability)
  .map<TableColumn>((column) => ({
    id: column.key,
    accessorKey: column.key,
    header: column.label,
    sortable: column.sortable,
    align: column.align,
    minWidth: column.width,
  })))

const hasActionsSlot = computed(() => Boolean(slots.actions))

const resolvedColumns = computed<TableColumn[]>(() => {
  const list: TableColumn[] = []

  if (selectable.value && !baseColumns.value.some(col => col.id === 'select')) {
    list.push({ id: 'select', accessorKey: 'select', header: '', width: '1%' })
  }

  list.push(...baseColumns.value)

  const existing = new Set(list.map(col => col.id || col.accessorKey))
  const caps = capabilities.value || {}

  if (caps.hasStatus && !existing.has('status')) {
    list.push({ id: 'status', accessorKey: 'status', header: tt('ui.fields.status', 'Status') })
    existing.add('status')
  }

  if (caps.translatable && !existing.has('translationStatus')) {
    list.push({ id: 'translationStatus', accessorKey: 'translationStatus', header: tt('ui.fields.translation', 'Translation') })
    existing.add('translationStatus')
  }

  if (caps.i18nHealth && !existing.has('i18nHealth')) {
    list.push({ id: 'i18nHealth', accessorKey: 'i18nHealth', header: tt('ui.fields.i18nHealth', 'i18n Health'), width: '1%' })
    existing.add('i18nHealth')
  }

  if (caps.hasTags && !existing.has('tags')) {
    list.push({ id: 'tags', accessorKey: 'tags', header: tt('ui.fields.tags', 'Tags') })
    existing.add('tags')
  }

  if (caps.hasRevisions && !existing.has('revisionCount')) {
    list.push({ id: 'revisionCount', accessorKey: 'revisionCount', header: tt('ui.fields.revisions', 'Revisions') })
    existing.add('revisionCount')
  }

  if ((hasActionsSlot.value || capabilities.value.actionsBatch) && !existing.has('actions')) {
    list.push({ id: 'actions', accessorKey: 'actions', header: tt('ui.table.actions', 'Actions'), width: '1%' })
  }

  return list
})

function builtinComponentFor(key: string | undefined) {
  switch (key) {
    case 'translationStatus':
      return { component: StatusBadge, badgeType: 'translation' as const }
    case 'release':
    case 'release_stage':
    case 'releaseStage':
      return { component: StatusBadge, badgeType: 'release' as const }
    case 'userStatus':
      return { component: StatusBadge, badgeType: 'user' as const }
    case 'status':
      return { component: StatusBadge, badgeType: 'status' as const }
    case 'i18nHealth':
      return { component: 'div', isI18nHealth: true }
    default:
      return null
  }
}

const slotColumns = computed(() => resolvedColumns.value
  .filter(column => column.id !== 'select')
  .map((column) => {
    const key = String(column.id || column.accessorKey || '')
    const config = builtinComponentFor(key)
    return {
      key,
      slotName: `${key}-cell`,
      component: config?.component ?? null,
      badgeType: (config as any)?.badgeType,
      isI18nHealth: (config as any)?.isI18nHealth,
    }
  }))

function buildComponentProps(column: { key: string; component: unknown; badgeType?: 'status' | 'release' | 'translation' | 'user'; isI18nHealth?: boolean }, ctx: { getValue?: () => unknown; row?: { original?: TableRowData } }) {
  const value = ctx?.getValue ? ctx.getValue() : ctx?.row?.original?.[column.key]

  if (column.isI18nHealth) {
    return {}
  }

  if (column.component === StatusBadge) {
    const row = ctx?.row?.original ?? {}
    let badgeType = column.badgeType ?? 'status'

    if (badgeType === 'status' && (row?.statusKind === 'user' || column.key === 'userStatus')) {
      badgeType = 'user'
    }

    const resolvedValue = (() => {
      if (value != null) return value
      if (badgeType === 'release') return row?.releaseStage ?? row?.release_stage ?? null
      if (badgeType === 'translation') return row?.translationStatus ?? null
      if (badgeType === 'user') return row?.userStatus ?? row?.status ?? null
      return row?.status ?? null
    })()

    return {
      type: badgeType,
      value: typeof resolvedValue === 'string' ? resolvedValue : (resolvedValue ?? null),
    }
  }

  return { ...ctx }
}

/**
 * Exposes selection helpers so parents can trigger batch mutations.
 * Example usage:
 * const table = ref<InstanceType<typeof CommonDataTable>>()
 * const batch = useBatchMutation({ kind: 'arcana', endpoint: '/arcana/batch' })
 * await table.value?.runBatchWith(async ids => batch.runBatch({ ids }))
 */
async function runBatchWith(handler: (ids: Array<string | number>) => Promise<unknown> | unknown) {
  const ids = selectedInternal.value.slice()
  if (!ids.length) return
  await handler(ids)
}

defineExpose({
  selectedIds: readonly(selectedInternal),
  runBatchWith,
})

const tableUi = computed(() => ({
  thead: 'text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400',
  tbody: 'divide-y divide-neutral-100 dark:divide-neutral-800',
  tr: {
    base: 'cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800'
  }
}))

const showHeader = computed(() => props.showToolbar || Boolean(slots.toolbar) || Boolean(slots.title) || Boolean(props.title))
const showDensityToggle = computed(() => props.densityToggle && densityOptions.value.length > 1)
const hasSelectionSlot = computed(() => Boolean(slots.selection))
const rootClasses = computed(() => ([
  'common-data-table space-y-4',
  densityInternal.value === 'compact' ? 'density-compact' : '',
  densityInternal.value === 'comfortable' ? 'density-comfortable' : '',
].filter(Boolean).join(' ')))

const showPagination = computed(() => metaState.totalPages > 1 || metaState.totalItems > metaState.pageSize)

const rowAttr = () => ({
  class: 'cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800',
  tabindex: 0,
})

const selectionAlertTitle = computed(() => t('ui.table.itemsSelected', { count: selectedInternal.value.length }) as string)

const allSelected = computed({
  get: () => items.value.length > 0 && selectedInternal.value.length === items.value.length,
  set: (value: boolean | 'indeterminate') => {
    selectedInternal.value = value === true ? items.value.map(rowKeyValue) : []
  },
})

function rowKeyValue(row: TableRowData): string | number {
  const key = props.rowKey ?? 'id'
  const value = row?.[key]
  return typeof value === 'number' || typeof value === 'string' ? value : String(value)
}

function toggleRow(row: TableRowData, include: boolean) {
  const key = rowKeyValue(row)
  const next = new Set(selectedInternal.value)
  if (include) next.add(key)
  else next.delete(key)
  selectedInternal.value = Array.from(next)
}

function handleSort(sort: { column: string; direction: 'asc' | 'desc' }) {
  sortInternal.value = sort
  emit('update:sort', sort)
}
</script>
