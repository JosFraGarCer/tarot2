<!-- app/components/admin/users/UserTable.vue -->
<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <UBadge color="primary" variant="soft">{{ tt('features.admin.users.count', '{n} accounts').replace('{n}', String(totalUsers)) }}</UBadge>
        <UBadge color="success" variant="soft">{{ tt('features.admin.users.active', '{n} active').replace('{n}', String(activeUsers)) }}</UBadge>
        <UBadge v-if="pendingInvites" color="warning" variant="soft">{{ tt('features.admin.users.pending', '{n} pending').replace('{n}', String(pendingInvites)) }}</UBadge>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="onResetFilters"
          size="xs"
          color="neutral"
          variant="soft"
          icon="i-heroicons-funnel"
          :label="tt('ui.actions.reset', 'Reset filters')"
          @click="onResetFilters()"
        />
        <UButton
          v-if="onCreate"
          size="xs"
          color="primary"
          icon="i-heroicons-plus"
          :label="tt('ui.actions.new', 'New user')"
          @click="onCreate()"
        />
      </div>
    </div>

    <EntityTableWrapper
      class="admin-user-table"
      :crud="crud"
      :label="label"
      :columns="columns"
      @edit="row => onEdit?.(row)"
      @delete="row => onDelete?.(row)"
      @export="ids => onExport?.(ids)"
      @batch-update="payload => onBatchUpdate?.(payload)"
      @create="() => onCreate?.()"
      @reset-filters="() => onResetFilters?.()"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { EntityRow } from '~/components/manage/view/EntityTable.vue'
import EntityTableWrapper from '~/components/manage/EntityTableWrapper.vue'

import type { ManageCrud } from '@/types/manage'

const props = withDefaults(defineProps<{
  crud: ManageCrud
  columns?: TableColumn<EntityRow>[]
  label?: string
  onEdit?: (row: Record<string, unknown>) => void
  onDelete?: (row: Record<string, unknown>) => void
  onExport?: (ids: number[]) => void
  onBatchUpdate?: (payload: unknown) => void
  onCreate?: () => void
  onResetFilters?: () => void
}>(), {
  columns: () => [],
  label: 'Users',
})

const { t, te } = useI18n()

function tt(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}

const rows = computed<EntityRow[]>(() => props.crud?.items?.value ?? [])

const totalUsers = computed(() => {
  const total = props.crud?.pagination?.value?.totalItems
  return typeof total === 'number' ? total : rows.value.length
})

const activeUsers = computed(() => rows.value.filter((row) => row?.status === 'active').length)

const pendingInvites = computed(() => rows.value.filter((row) => row?.status === 'pending' || row?.status === 'invited').length)
</script>

<style scoped>
.admin-user-table {
  min-height: 14rem;
}
</style>
