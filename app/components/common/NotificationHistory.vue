<template>
  <UPopover>
    <UButton
      icon="i-heroicons-bell"
      variant="ghost"
      color="neutral"
      :badge="unreadCount > 0 ? unreadCount : undefined"
      :aria-label="t('notifications.history.title')"
    />

    <template #content>
      <div class="w-80 flex flex-col max-h-[28rem]">
        <header class="p-3 border-b flex items-center justify-between bg-neutral-50 dark:bg-neutral-900">
          <h3 class="text-sm font-semibold">{{ t('notifications.history.title', 'Notifications') }}</h3>
          <UButton
            v-if="history.length > 0"
            size="xs"
            variant="ghost"
            color="neutral"
            @click="clearHistory"
          >
            {{ t('notifications.history.clear', 'Clear all') }}
          </UButton>
        </header>

        <div class="flex-1 overflow-y-auto p-2">
          <div v-if="history.length === 0" class="py-8 text-center text-neutral-500 text-sm">
            {{ t('notifications.history.empty', 'No recent activity') }}
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="item in history"
              :key="item.id"
              class="p-3 rounded-lg border text-xs transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
              :class="[
                item.read ? 'opacity-60' : 'border-primary-500/30 bg-primary-50/10'
              ]"
              @mouseenter="markAsRead(item.id)"
            >
              <div class="flex items-start gap-2">
                <UIcon
                  v-if="item.icon"
                  :name="item.icon"
                  class="w-4 h-4 shrink-0 mt-0.5"
                  :class="colorClass(item.color)"
                />
                <div class="flex-1 min-w-0">
                  <p class="font-semibold truncate">{{ item.title }}</p>
                  <p v-if="item.description" class="text-neutral-500 line-clamp-2 mt-0.5">
                    {{ item.description }}
                  </p>
                  <p class="text-[10px] text-neutral-400 mt-1">
                    {{ formatTime(item.timestamp) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'
import { useNotificationStore } from '~/stores/notifications'
import { storeToRefs } from 'pinia'

const { t } = useI18n()
const store = useNotificationStore()
const { history } = storeToRefs(store)
const { markAsRead, clearHistory } = store

const unreadCount = computed(() => history.value.filter(n => !n.read).length)

function colorClass(color?: string) {
  switch (color) {
    case 'success': return 'text-success-500'
    case 'warning': return 'text-warning-500'
    case 'error': return 'text-error-500'
    case 'primary': return 'text-primary-500'
    default: return 'text-neutral-500'
  }
}

function formatTime(timestamp: number) {
  const diff = Date.now() - timestamp
  if (diff < 60000) return t('common.time.now', 'Just now')
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>
