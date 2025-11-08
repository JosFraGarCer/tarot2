<!-- /app/pages/admin/users.vue -->
<template>
  <div class="px-4">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ t('nav.manageUsers') }}
          </h1>
        </div>
      </template>

      <EntityBase
        :label="t('nav.manageUsers')"
        :use-crud="useAdminUsersCrud"
        view-mode="tabla"
        entity="user"
        :filters-config="filtersConfig"
        :columns="columns"
        :no-tags="true"
        :card-type="false"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'
import EntityBase from '~/components/manage/EntityBase.vue'
import { useAdminUsersCrud } from '~/composables/admin/useUsers'
import type { TableColumn } from '@nuxt/ui'
import type { EntityRow } from '~/components/manage/view/EntityTable.vue'

definePageMeta({ layout: 'default' })

const { t } = useI18n()

const filtersConfig = {
  search: 'search',
  status: 'status',
  is_active: 'is_active',
  type: 'role_id',
}

const columns = computed<TableColumn<EntityRow>[]>(() => ([
  {
    accessorKey: 'email',
    header: t('common.email'),
  },
  {
    accessorKey: 'roles',
    header: t('common.roles'),
    cell: ({ row }) => {
      const roles = Array.isArray(row.raw?.roles) ? row.raw.roles : []
      return roles.map((role: any) => role.name).join(', ')
    },
  },
  {
    accessorKey: 'created_at',
    header: t('common.createdAt'),
  },
  {
    accessorKey: 'status',
    header: t('common.status'),
  },
]))
</script>

