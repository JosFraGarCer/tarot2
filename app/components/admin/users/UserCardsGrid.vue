<!-- app/components/admin/users/UserCardsGrid.vue -->
<template>
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <UCard
      v-for="user in users"
      :key="user.id"
      class="h-full flex flex-col justify-between"
    >
      <div class="space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3">
            <UAvatar v-if="user.image" :src="resolveAvatar(user.image)" size="3xl" />
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  {{ user.username || user.email || `#${user.id}` }}
                </h3>
                <UBadge
                  :color="badgeColor(user.status)"
                  variant="soft"
                >
                  {{ user.status || 'unknown' }}
                </UBadge>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ user.email || '—' }}
              </p>
            </div>
          </div>
          <div v-if="user.permissions" class="text-xs text-gray-500 dark:text-gray-400">
            {{ tt('features.admin.users.permissionsCount', '{n} perms').replace('{n}', String(Object.keys(user.permissions).length)) }}
          </div>
        </div>

        <div v-if="user.roles?.length" class="flex flex-wrap gap-2 text-xs">
          <UBadge
            v-for="role in user.roles"
            :key="role.id"
            color="primary"
            variant="soft"
          >
            {{ role.name || `#${role.id}` }}
          </UBadge>
        </div>

        <div class="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <div v-if="user.created_at" class="flex items-center gap-2">
            <UIcon name="i-heroicons-calendar-days" class="h-4 w-4" />
            {{ tt('features.admin.users.created', 'Created') }}: {{ formatDate(user.created_at) }}
          </div>
          <div v-if="user.modified_at" class="flex items-center gap-2">
            <UIcon name="i-heroicons-clock" class="h-4 w-4" />
            {{ tt('features.admin.users.updated', 'Updated') }}: {{ formatDate(user.modified_at) }}
          </div>
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <UButton size="xs" variant="soft" color="primary" icon="i-heroicons-pencil" @click="$emit('edit', user)">
          {{ tt('ui.actions.edit', 'Edit') }}
        </UButton>
        <UButton size="xs" variant="soft" color="error" icon="i-heroicons-trash" @click="$emit('delete', user)">
          {{ tt('ui.actions.delete', 'Delete') }}
        </UButton>
      </div>
    </UCard>
  </div>
  <div v-if="!users.length" class="rounded border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
    {{ tt('common.noResults', 'No results found') }}
  </div>
</template>

<script setup lang="ts">
import type { AdminUserEntity } from '@/types/admin'

const props = defineProps<{
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

function resolveAvatar(src?: string | null) {
  if (!src) return undefined
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('/')) return src
  return `/img/${src}`
}
</script>
