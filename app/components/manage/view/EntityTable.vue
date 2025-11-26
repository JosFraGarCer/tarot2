<!-- app/components/manage/EntityTable.vue -->
<template>
  <div v-bind="$attrs">
    <!-- Selection toolbar -->
    <div v-if="internalSelected.length" v-can="['canEditContent','canPublish']" class="mb-3 flex items-center gap-2">
      <span class="text-sm text-gray-500">{{ internalSelected.length }} selected</span>
      <UButton icon="i-heroicons-arrow-up-tray" color="primary" variant="soft" :label="$t('ui.actions.export') || 'Export'" @click="onExportSelected" />
      <UButton icon="i-heroicons-arrow-path" color="neutral" variant="soft" :label="$t('ui.actions.update') || 'Update'" @click="onUpdateSelected" />
    </div>

    <UTable
      :data="rows"
      :columns="tableColumns"
      :loading="loading"
      class="w-full"
    >
      <template #loading>
        <slot name="loading" />
      </template>
      <template #empty>
        <slot name="empty" />
      </template>
    <!-- Select all / row select -->
    <template #select-header>
      <UCheckbox v-model="allSelectedComputed" />
    </template>

    <template #select-cell="{ row }">
      <UCheckbox
        :model-value="internalSelected.includes(row.original.id)"
        @update:model-value="(v) => toggleSelect(row.original.id, v)"
      />
    </template>

    <!-- Name with optional avatar and language badge -->
    <template #name-cell="{ row, getValue }">
      <div class="flex items-center gap-2">
        <UAvatar v-if="row.original.img" :src="resolveImage(row.original.img)" size="md" icon="i-heroicons-photo" :alt="String(getValue())" />
        <span class="font-medium">{{ getValue() }}</span>
        <UBadge v-if="row.original.lang" size="xs" color="neutral" variant="outline">{{ row.original.lang }}</UBadge>
      </div>
    </template>

    <!-- Short text with description on hover -->
    <template #short_text-cell="{ row }">
      <UTooltip :text="row.original.description || ''">
        <span class="block max-w-[40ch] truncate">{{ row.original.short_text || '' }}</span>
      </UTooltip>
    </template>

    <!-- Status badge -->
    <template #status-cell="{ row }">
      <StatusBadge
        :type="row.original.statusKind === 'user' ? 'user' : 'status'"
        :value="typeof row.original.status === 'string' ? row.original.status : null"
      />
    </template>

    <!-- Active badge -->
    <template #is_active-cell="{ row }">
      <UBadge
        :label="row.original.is_active ? $t('active') : $t('inactive')"
        :color="row.original.is_active ? 'primary' : 'neutral'"
        size="sm"
      />
    </template>

    <template #code-cell="{ getValue }">
      <span class="font-mono text-xs text-neutral-600 dark:text-neutral-300">{{ getValue() }}</span>
    </template>
    <template #lang-cell="{ getValue }">
      <UBadge size="xs" color="neutral" variant="outline">{{ getValue() }}</UBadge>
    </template>
    <template #card_type-cell="{ getValue }">
      <span class="truncate block max-w-[18ch]" :title="String(getValue() ?? '')">{{ getValue() }}</span>
    </template>
    <template #tags-cell="{ getValue }">
      <div class="flex flex-wrap gap-1 max-w-[38ch]">
        <UBadge
          v-for="tag in String(getValue() || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)"
          :key="tag"
          size="xs"
          color="primary"
          variant="soft"
          :title="tag"
        >
          {{ tag }}
        </UBadge>
        <span v-if="!String(getValue() || '').trim()" class="text-xs text-neutral-400">—</span>
      </div>
    </template>
    <template #arcana-cell="{ getValue }">
      <span class="truncate block max-w-[18ch]" :title="String(getValue() ?? '')">{{ getValue() }}</span>
    </template>
    <template #facet-cell="{ getValue }">
      <span class="truncate block max-w-[18ch]" :title="String(getValue() ?? '')">{{ getValue() }}</span>
    </template>
    <template #updated_at-cell="{ getValue }">
      <span class="text-xs text-neutral-500">{{ formatDate(getValue()) }}</span>
    </template>
    <template #created_at-cell="{ getValue }">
      <span class="text-xs text-neutral-500">{{ formatDate(getValue()) }}</span>
    </template>
    <template #roles-cell="{ row }">
      <div class="flex flex-wrap gap-1">
        <UBadge
          v-for="role in row.original.roles || []"
          :key="role"
          size="xs"
          color="primary"
          variant="soft"
        >
          {{ role }}
        </UBadge>
        <span v-if="!row.original.roles?.length" class="text-xs text-neutral-400">{{ $t('domains.user.noRoles') }}</span>
      </div>
    </template>
    <template #parent-cell="{ getValue }">
      <span class="truncate block max-w-[24ch]" :title="String(getValue() ?? '')">{{ getValue() }}</span>
    </template>

    <!-- Actions slot passthrough -->
    <template #actions-cell="{ row }">
      <slot name="actions" :row="row.original" />
    </template>
    </UTable>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useI18n } from '#imports'
import StatusBadge from '~/components/common/StatusBadge.vue'
defineOptions({ inheritAttrs: false })

export type EntityRow = {
  id: number
  name: string
  short_text?: string
  description?: string
  status?: string | null
  statusKind?: 'card' | 'user'
  is_active?: boolean | null
  img?: string | null
  code?: string | null
  lang?: string | null
  card_type?: string | null
  arcana?: string | null
  facet?: string | null
  parent?: string | null
  category?: string | null
  tags?: string | null
  updated_at?: string | Date | null
  created_at?: string | Date | null
  email?: string | null
  username?: string | null
  roles?: string[]
  permissions?: Record<string, boolean>
  raw?: any
}

const props = defineProps<{
  rows: EntityRow[]
  loading?: boolean
  selectedIds?: number[]
  columns?: TableColumn<EntityRow>[]
  crud?: { resourcePath: string }
}>()

const emit = defineEmits<{
  (e: 'update:selectedIds', value: number[]): void
  (e: 'export-selected', value: number[]): void
  (e: 'update-selected', value: number[]): void
}>()

const { t, locale } = useI18n()

const defaultColumns = computed<TableColumn<EntityRow>[]>(() => ([
  { id: 'select', header: '' },
  { accessorKey: 'name', header: t('ui.fields.name') },
  { accessorKey: 'short_text', header: t('ui.fields.shortText') },
  { accessorKey: 'status', header: t('ui.fields.status') },
  { accessorKey: 'is_active', header: t('ui.states.active') },
  { id: 'actions', header: t('ui.table.actions') }
]))

const tableColumns = computed<TableColumn<EntityRow>[]>(() => {
  const base = defaultColumns.value
  if (!props.columns?.length) return base

  const selectColumn = base.find(col => col.id === 'select')
  const actionColumn = base.find(col => col.id === 'actions')
  let baseCore = base.filter(col => col.id !== 'actions' && col.id !== 'select')
  const resourcePath = props.crud?.resourcePath || ''
  const isUserEntity = resourcePath.includes('/user')
  const extras = props.columns.filter(col => col.id !== 'select' && col.id !== 'actions')

  if (isUserEntity) {
    baseCore = baseCore.filter(col => col.accessorKey !== 'is_active')
  }

  return [
    ...(selectColumn ? [selectColumn] : []),
    ...baseCore,
    ...extras,
    ...(actionColumn ? [actionColumn] : []),
  ]
})

const internalSelected = computed<number[]>({
  get: () => Array.isArray(props.selectedIds) ? props.selectedIds : [],
  set: (v) => emit('update:selectedIds', v)
})

// "Select all" (sobre los rows actuales)
const allSelectedComputed = computed({
  get: () => props.rows.length > 0 && internalSelected.value.length === props.rows.length,
  set: (value: boolean | 'indeterminate') => {
    internalSelected.value = (value === true) ? props.rows.map((r) => r.id) : []
  }
})

function toggleSelect(id: number, value: boolean) {
  const set = new Set(internalSelected.value)
  if (value) set.add(id)
  else set.delete(id)
  internalSelected.value = Array.from(set)
}

function onExportSelected() {
  emit('export-selected', internalSelected.value)
}
function onUpdateSelected() {
  emit('update-selected', internalSelected.value)
}

function formatDate(value: unknown) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value as any)
  if (Number.isNaN(date.getTime())) return ''
  const localeCode = typeof locale === 'string' ? locale : locale.value
  try {
    return new Intl.DateTimeFormat(localeCode || 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
  } catch {
    return date.toISOString()
  }
}

function resolveImage(src?: string) {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('/')) return src
  
  return `/img/${src}`
}
</script>
