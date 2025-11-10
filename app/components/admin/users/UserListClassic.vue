<!-- app/components/admin/users/UserListClassic.vue -->
<template>
  <div class="space-y-3">
    <div
      v-for="user in users"
      :key="user.id"
      class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <UAvatar v-if="user.image" :src="resolveAvatar(user.image)" size="3xl" />
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ user.username || user.email || `#${user.id}` }}
              </h3>
              <UBadge
                :color="user.status === 'active' ? 'success' : user.status === 'suspended' ? 'warning' : 'neutral'"
                variant="soft"
              >
                {{ user.status || 'unknown' }}
              </UBadge>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ user.email || '—' }}
            </p>
            <div v-if="user.roles?.length" class="mt-1 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span v-for="role in user.roles" :key="role.id" class="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-0.5 dark:border-gray-600">
                <UIcon name="i-heroicons-identification" class="h-4 w-4" />
                {{ role.name || `#${role.id}` }}
              </span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UButton size="xs" variant="soft" color="primary" icon="i-heroicons-pencil" @click="$emit('edit', user)">
            {{ tt('ui.actions.edit', 'Edit') }}
          </UButton>
          <UButton size="xs" variant="soft" color="error" icon="i-heroicons-trash" @click="$emit('delete', user)">
            {{ tt('ui.actions.delete', 'Delete') }}
          </UButton>
        </div>
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span class="inline-flex items-center gap-1">
          <UIcon name="i-heroicons-shield-check" class="h-4 w-4" />
          {{ tt('features.admin.users.permissionsCount', '{n} permissions').replace('{n}', String(Object.keys(user.permissions || {}).length)) }}
        </span>
        <span v-if="user.created_at" class="inline-flex items-center gap-1">
          <UIcon name="i-heroicons-calendar-days" class="h-4 w-4" />
          {{ tt('features.admin.users.created', 'Created') }}: {{ formatDate(user.created_at) }}
        </span>
        <span v-if="user.modified_at" class="inline-flex items-center gap-1">
          <UIcon name="i-heroicons-clock" class="h-4 w-4" />
          {{ tt('features.admin.users.updated', 'Updated') }}: {{ formatDate(user.modified_at) }}
        </span>
      </div>
    </div>

    <div v-if="!users.length" class="rounded border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
      {{ tt('common.noResults', 'No results found') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AdminUserEntity } from '@/types/admin'

const props = defineProps<{
  users: AdminUserEntity[]
}>()

const { t, te } = useI18n()

function tt(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function resolveAvatar(src?: string | null) {
  if (!src) return undefined
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('/')) return src
  return `/img/${src}`
}
</script>
