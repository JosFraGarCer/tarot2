<!-- app/components/admin/users/UserCartaView.vue -->
<template>
  <div class="space-y-4">
    <div
      v-for="user in users"
      :key="user.id"
      class="rounded-lg border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-4 shadow dark:border-primary-700 dark:from-primary-900/40 dark:to-gray-900"
    >
      <header class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-primary-700 dark:text-primary-200">
            {{ user.username || user.email || `#${user.id}` }}
          </h3>
          <p class="text-sm text-primary-600/80 dark:text-primary-200/80">
            {{ user.email || tt('features.admin.users.noEmail', 'No email available') }}
          </p>
        </div>
        <UBadge :color="badgeColor(user.status)" variant="solid">
          {{ user.status || 'unknown' }}
        </UBadge>
      </header>

      <section class="mt-3 grid gap-3 sm:grid-cols-2">
        <div class="space-y-2">
          <h4 class="text-xs font-semibold uppercase tracking-wide text-primary-500 dark:text-primary-300">
            {{ tt('common.roles', 'Roles') }}
          </h4>
          <div class="space-y-1 text-sm text-gray-700 dark:text-gray-200">
            <p v-if="!user.roles?.length" class="italic">
              {{ tt('features.admin.users.noRoles', 'No roles assigned') }}
            </p>
            <div v-else class="flex flex-wrap gap-2">
              <UBadge v-for="role in user.roles" :key="role.id" color="primary" variant="soft">
                {{ role.name || `#${role.id}` }}
              </UBadge>
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <h4 class="text-xs font-semibold uppercase tracking-wide text-primary-500 dark:text-primary-300">
            {{ tt('features.admin.users.permissions', 'Permissions') }}
          </h4>
          <p class="text-sm text-gray-700 dark:text-gray-200">
            {{ tt('features.admin.users.permissionsCountLong', '{n} merged permissions').replace('{n}', String(Object.keys(user.permissions || {}).length)) }}
          </p>
        </div>
      </section>

      <footer class="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600 dark:text-gray-300">
        <div class="flex flex-wrap gap-3">
          <span v-if="user.created_at" class="inline-flex items-center gap-1">
            <UIcon name="i-heroicons-calendar-days" class="h-4 w-4" />
            {{ tt('features.admin.users.created', 'Created') }}: {{ formatDate(user.created_at) }}
          </span>
          <span v-if="user.modified_at" class="inline-flex items-center gap-1">
            <UIcon name="i-heroicons-clock" class="h-4 w-4" />
            {{ tt('features.admin.users.updated', 'Updated') }}: {{ formatDate(user.modified_at) }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <UButton size="xs" color="primary" variant="soft" icon="i-heroicons-pencil" @click="$emit('edit', user)">
            {{ tt('ui.actions.edit', 'Edit') }}
          </UButton>
          <UButton size="xs" color="error" variant="soft" icon="i-heroicons-trash" @click="$emit('delete', user)">
            {{ tt('ui.actions.delete', 'Delete') }}
          </UButton>
        </div>
      </footer>
    </div>

    <div v-if="!users.length" class="rounded border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
      {{ tt('common.noResults', 'No results found') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminUserEntity } from '@/types/admin'

defineProps<{
  users: AdminUserEntity[]
}>()

const { t, te } = useI18n()

function tt(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}

function badgeColor(status?: string | null) {
  if (!status) return 'neutral'
  const normalized = status.toLowerCase()
  if (normalized === 'active') return 'success'
  if (normalized === 'suspended') return 'warning'
  if (normalized === 'inactive' || normalized === 'disabled') return 'neutral'
  return 'primary'
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}
</script>
