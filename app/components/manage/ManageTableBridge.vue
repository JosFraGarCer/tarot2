<template>
  <div class="manage-table-bridge space-y-4">
    <BulkActionsBar v-if="hasBulkActionsSlot && selectedValues.length" :selected="selectedValues">
      <slot name="bulk-actions" :selected="selectedValues" />
    </BulkActionsBar>

    <CommonDataTable
      :items="tableRows"
      :columns="columnDefinitions"
      :loading="loading"
      :meta="metaState"
      :selectable="isSelectable"
      :selected-keys="selectedValues"
      :entity-kind="entityKind"
      :capabilities="capabilities"
      :density="density"
      :density-toggle="densityToggle"
      :title="title"
      :show-toolbar="showToolbar"
      :sort="sort"
      :page-size-items="pageSizeItems"
      @update:selected="handleSelectedUpdate"
      @update:page="value => emit('update:page', value)"
      @update:pageSize="value => emit('update:pageSize', value)"
      @update:sort="value => emit('update:sort', value)"
      @row:click="row => emit('row:click', row?.original ?? row)"
      @row:dblclick="row => emit('row:dblclick', row?.original ?? row)"
    >
      <template #selection="slotProps">
        <slot name="selection" v-bind="slotProps" />
      </template>

      <template v-if="$slots.title" #title>
        <slot name="title" />
      </template>

      <template v-if="$slots.toolbar" #toolbar="slotProps">
        <slot name="toolbar" v-bind="slotProps" />
      </template>

      <template v-if="$slots['row-preview']" #row-preview="slotProps">
        <slot name="row-preview" v-bind="slotProps" />
      </template>

      <template v-if="$slots.empty" #empty>
        <slot name="empty" />
      </template>

      <template v-if="$slots.loading" #loading>
        <slot name="loading" />
      </template>

      <template v-if="$slots.footer" #footer="slotProps">
        <slot name="footer" v-bind="slotProps" />
      </template>

      <template
        v-for="column in columnSlots"
        :key="column"
        #[`cell-${column}`]="slotProps"
      >
        <slot :name="`cell-${column}`" v-bind="slotProps" />
      </template>
    </CommonDataTable>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { ComputedRef } from 'vue'
import { useI18n } from '#imports'
import type { TableColumn, TableSort } from '@nuxt/ui'
import CommonDataTable, { type ColumnDefinition } from '~/components/common/CommonDataTable.vue'
import BulkActionsBar from '~/components/manage/BulkActionsBar.vue'
import type { ListMeta } from '~/composables/common/useListMeta'
import type { EntityCapabilities } from '~/composables/common/useEntityCapabilities'
import { mapEntitiesToRows } from '~/utils/manage/entityRows'
import type { EntityRow } from '~/components/manage/view/EntityTable.vue'

interface SelectionAdapter {
  selectedList: ComputedRef<Array<string | number>>
  setSelected?: (ids: Iterable<string | number>) => void
}

type LegacyColumn = TableColumn<any> & { accessorKey?: string; id?: string; header?: string }

const props = withDefaults(defineProps<{
  items?: any[]
  columns: Array<ColumnDefinition | LegacyColumn>
  meta?: Partial<ListMeta> | null
  loading?: boolean
  selection?: SelectionAdapter | null
  selectedKeys?: Array<string | number>
  selectable?: boolean
  entityKind?: string | null
  capabilities?: Partial<EntityCapabilities> | null
  density?: 'comfortable' | 'regular' | 'compact'
  densityToggle?: boolean
  title?: string
  showToolbar?: boolean
  sort?: TableSort | null
  pageSizeItems?: Array<{ label: string; value: number }>
  resourcePath?: string
  entityLabel?: string
  entityKey?: string | null
}>(), {
  items: () => [],
  meta: null,
  loading: false,
  selection: null,
  selectedKeys: () => [],
  selectable: undefined,
  entityKind: null,
  capabilities: null,
  density: 'regular',
  densityToggle: true,
  title: '',
  showToolbar: true,
  sort: null,
  pageSizeItems: undefined,
  resourcePath: '',
  entityLabel: '',
  entityKey: null,
})

const slots = useSlots()

const emit = defineEmits<{
  (e: 'update:selected', value: Array<string | number>): void
  (e: 'update:page', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'update:sort', value: TableSort): void
  (e: 'row:click', value: any): void
  (e: 'row:dblclick', value: any): void
}>()

const { t } = useI18n()

const rawItems = computed(() => props.items ?? [])

const tableRows = computed<EntityRow[]>(() => mapEntitiesToRows(rawItems.value, {
  resourcePath: props.resourcePath || '',
  label: props.entityLabel || '',
  entity: props.entityKey || props.entityKind || undefined,
}))

const hasBulkActionsSlot = computed(() => Boolean(slots['bulk-actions']))

const selection = computed(() => props.selection ?? null)

const selectedValues = computed<Array<string | number>>(() => {
  if (selection.value) return selection.value.selectedList.value
  return Array.isArray(props.selectedKeys) ? props.selectedKeys : []
})

function arraysMatch(a: Array<string | number>, b: Array<string | number>): boolean {
  if (a.length !== b.length) return false
  const setA = new Set(a)
  if (setA.size !== a.length) return false
  for (const entry of b) {
    if (!setA.has(entry)) return false
  }
  return true
}

function handleSelectedUpdate(value: Array<string | number>) {
  const current = selectedValues.value
  if (arraysMatch(current, value)) {
    return
  }
  selection.value?.setSelected?.(value)
  emit('update:selected', value)
}

const isSelectable = computed(() => {
  if (typeof props.selectable === 'boolean') return props.selectable
  return Boolean(selection.value)
})

const metaState = computed<Partial<ListMeta> | undefined>(() => {
  if (props.meta) return props.meta
  return {
    page: 1,
    pageSize: rawItems.value.length || 20,
    totalItems: rawItems.value.length,
    totalPages: 1,
  }
})

const capabilities = computed(() => props.capabilities ?? undefined)
const pageSizeItems = computed(() => props.pageSizeItems ?? undefined)
const loading = computed(() => Boolean(props.loading))
const density = computed(() => props.density)
const densityToggle = computed(() => props.densityToggle)
const title = computed(() => props.title)
const showToolbar = computed(() => props.showToolbar)
const sort = computed(() => props.sort ?? null)

const columnDefinitions = computed<ColumnDefinition[]>(() => {
  const extras = props.columns.length ? props.columns : defaultColumns.value
  return extras.map(column => normalizeColumn(column))
})

const columnSlots = computed(() => columnDefinitions.value.map(column => column.key))

function normalizeColumn(column: ColumnDefinition | LegacyColumn): ColumnDefinition {
  if ('key' in column && column.key) {
    return {
      key: column.key,
      label: column.label,
      sortable: column.sortable,
      width: column.width,
      align: column.align,
      capability: column.capability ?? inferCapability(column.key),
    }
  }

  const legacy = column as LegacyColumn
  const key = String(legacy.accessorKey || legacy.id || '').trim()
  return {
    key: key || `col-${Math.random().toString(36).slice(2)}`,
    label: typeof legacy.header === 'string' ? legacy.header : undefined,
    sortable: legacy.sortable,
    align: legacy.align,
    capability: inferCapability(key),
  }
}

const defaultColumns = computed<ColumnDefinition[]>(() => ([
  { key: 'name', label: t('ui.fields.name'), sortable: true },
  { key: 'short_text', label: t('ui.fields.shortText') },
  { key: 'status', label: t('ui.fields.status') },
  { key: 'is_active', label: t('ui.states.active') },
  { key: 'actions', label: t('ui.table.actions'), width: '1%' },
]))

function inferCapability(key: string): ColumnDefinition['capability'] {
  switch (key) {
    case 'tags':
      return 'hasTags'
    case 'translationStatus':
      return 'translatable'
    case 'status':
      return 'hasStatus'
    default:
      return undefined
  }
}
</script>

<style scoped>
.manage-table-bridge {
  min-height: 12rem;
}
</style>
