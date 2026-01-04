<!-- app/components/admin/AdminTableBridge.vue -->
<template>
  <div class="admin-table-bridge space-y-4">
    <BulkActionsBar v-if="hasBulkActionsSlot && selectedIds.length">
      <slot name="bulk-actions" :selected="selectedIds" />
    </BulkActionsBar>

    <CommonDataTable
      :items="items"
      :columns="resolvedColumns"
      :meta="metaState"
      :loading="loadingState"
      :selectable="isSelectable"
      :selected-keys="selectedIds"
      :capabilities="capabilitiesState"
      :entity-kind="entityKind"
      :density="density"
      :density-toggle="densityToggle"
      :title="title"
      :show-toolbar="showToolbar"
      :page-size-items="pageSizeItems"
      :sort="sortState"
      @update:selected="handleSelectedUpdate"
      @update:page="value => emit('update:page', value)"
      @update:page-size="value => emit('update:pageSize', value)"
      @update:sort="value => emit('update:sort', value)"
      @row:click="row => emit('row:click', row?.original ?? row)"
      @row:dblclick="row => emit('row:dblclick', row?.original ?? row)"
    >
      <template v-if="$slots.toolbar" #toolbar="slotProps">
        <slot name="toolbar" v-bind="slotProps" />
      </template>

      <template v-if="$slots.selection" #selection="slotProps">
        <slot name="selection" v-bind="slotProps" />
      </template>

      <template v-if="$slots['row-preview']" #row-preview="slotProps">
        <slot name="row-preview" v-bind="{ row: slotProps.row?.original, openPreview }" />
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

    <EntityInspectorDrawer
      v-if="previewEntity"
      v-model:open="drawerOpen"
      :entity="previewEntity"
      :raw-entity="previewRaw"
      :kind="previewKind"
      :capabilities="capabilitiesState"
      :lang="previewLang"
    >
      <template v-if="$slots['preview-actions']" #actions="slotProps">
        <slot name="preview-actions" v-bind="slotProps" />
      </template>
    </EntityInspectorDrawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, useSlots } from 'vue'
import type { TableSort } from '@nuxt/ui'
import BulkActionsBar from '~/components/manage/BulkActionsBar.vue'
import CommonDataTable, { type ColumnDefinition } from '~/components/common/CommonDataTable.vue'
import type { ListMeta } from '~/composables/common/useListMeta'
import type { EntityCapabilities } from '~/composables/common/useEntityCapabilities'
import type { EntityRow } from '~/components/manage/view/EntityTable.vue'
import EntityInspectorDrawer from '~/components/manage/EntityInspectorDrawer.vue'

type SelectionAdapter = {
  selectedList: { value: Array<string | number> }
  setSelected?: (ids: Iterable<string | number>) => void
}

const props = withDefaults(defineProps<{
  items?: EntityRow[]
  columns?: Array<ColumnDefinition>
  meta?: Partial<ListMeta> | null
  loading?: boolean
  selection?: SelectionAdapter | null
  selectedKeys?: Array<string | number>
  selectable?: boolean
  capabilities?: Partial<EntityCapabilities> | null
  entityKind?: string | null
  density?: 'comfortable' | 'regular' | 'compact'
  densityToggle?: boolean
  title?: string
  showToolbar?: boolean
  sort?: TableSort | null
  pageSizeItems?: Array<{ label: string; value: number }>
}>(), {
  items: () => [],
  columns: () => [],
  meta: null,
  loading: false,
  selection: null,
  selectedKeys: () => [],
  selectable: undefined,
  capabilities: null,
  entityKind: null,
  density: 'regular',
  densityToggle: true,
  title: '',
  showToolbar: true,
  sort: null,
  pageSizeItems: undefined,
})

const emit = defineEmits<{
  (e: 'update:selected', value: Array<string | number>): void
  (e: 'update:page' | 'update:pageSize', value: number): void
  (e: 'update:sort', value: TableSort): void
  (e: 'row:click' | 'row:dblclick' | 'row:preview', value: EntityRow): void
}>()

const slots = useSlots()
const selection = computed(() => props.selection ?? null)

const selectedIds = computed<Array<string | number>>(() => {
  if (selection.value) return selection.value.selectedList.value
  return Array.isArray(props.selectedKeys) ? props.selectedKeys : []
})

function arraysMatch(a: Array<string | number>, b: Array<string | number>) {
  if (a.length !== b.length) return false
  const setA = new Set(a)
  if (setA.size !== a.length) return false
  for (const entry of b) {
    if (!setA.has(entry)) return false
  }
  return true
}

function handleSelectedUpdate(value: Array<string | number>) {
  const current = selectedIds.value
  if (arraysMatch(current, value)) return
  selection.value?.setSelected?.(value)
  emit('update:selected', value)
}

const isSelectable = computed(() => {
  if (typeof props.selectable === 'boolean') return props.selectable
  return Boolean(selection.value)
})

const resolvedColumns = computed(() => props.columns && props.columns.length
  ? props.columns
  : defaultColumns.value)

const defaultColumns = computed<ColumnDefinition[]>(() => ([
  { key: 'name', label: 'Name', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions', label: 'Actions', width: '1%' },
]))

const columnSlots = computed(() => resolvedColumns.value.map(column => column.key))

const metaState = computed<Partial<ListMeta> | undefined>(() => {
  if (props.meta) return props.meta
  const total = props.items?.length ?? 0
  return {
    page: 1,
    pageSize: total,
    totalItems: total,
    totalPages: 1,
  }
})
const loadingState = computed(() => Boolean(props.loading))
const capabilitiesState = computed(() => props.capabilities ?? undefined)
const entityKind = computed(() => props.entityKind ?? null)
const density = computed(() => props.density)
const densityToggle = computed(() => props.densityToggle)
const title = computed(() => props.title)
const showToolbar = computed(() => props.showToolbar)
const pageSizeItems = computed(() => props.pageSizeItems ?? undefined)
const sortState = computed(() => props.sort ?? null)

const hasBulkActionsSlot = computed(() => Boolean(slots['bulk-actions']))

const drawerOpen = ref(false)
const previewEntity = ref<EntityRow | null>(null)

const previewRaw = computed(() => (previewEntity.value?.raw as Record<string, unknown> | null) ?? null)
const previewKind = computed(() => (previewEntity.value?.raw as Record<string, unknown>)?.entity_type as string | null ?? entityKind.value ?? null)
const previewLang = computed(() => previewEntity.value?.lang ?? (previewEntity.value?.raw as Record<string, unknown>)?.language_code as string | null ?? null)

watch(() => props.items, (next) => {
  if (!drawerOpen.value || !previewEntity.value) return
  const match = next.find(entry => entry.id === previewEntity.value?.id)
  if (!match) {
    drawerOpen.value = false
    previewEntity.value = null
  } else {
    previewEntity.value = match
  }
})

function openPreview(entity: EntityRow) {
  previewEntity.value = entity
  drawerOpen.value = true
  emit('row:preview', entity)
}

function closePreview() {
  drawerOpen.value = false
}

defineExpose({
  openPreview,
  closePreview,
})
</script>

<style scoped>
.admin-table-bridge {
  min-height: 12rem;
}
</style>
