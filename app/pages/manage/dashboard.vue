<!-- app/pages/manage/dashboard.vue -->
<template>
  <div class="px-4 py-6">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ tt('features.editorial.dashboardTitle', 'Editorial Dashboard') }}
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {{ tt('features.editorial.dashboardSubtitle', 'Overview of your editorial work, pending reviews and blocked content.') }}
          </p>
        </div>
        <UButton
          icon="i-heroicons-arrow-path"
          color="neutral"
          variant="soft"
          :loading="loading"
          :label="tt('ui.actions.refresh', 'Refresh')"
          @click="refresh"
        />
      </header>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Section 1: My Drafts -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-pencil-square" class="text-neutral-500" />
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ tt('features.editorial.myDrafts', 'My Drafts') }}
              </h2>
              <UBadge v-if="drafts.total" size="xs" color="neutral" variant="subtle">
                {{ drafts.total }}
              </UBadge>
            </div>
          </template>

          <div v-if="drafts.loading" class="space-y-3">
            <USkeleton v-for="i in 3" :key="i" class="h-10 w-full" />
          </div>
          <UAlert
            v-else-if="drafts.error"
            color="error"
            icon="i-heroicons-exclamation-triangle"
            :description="drafts.error"
          />
          <div v-else-if="!drafts.items.length" class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {{ tt('features.editorial.noDrafts', 'No drafts in progress.') }}
          </div>
          <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <div
              v-for="item in drafts.items"
              :key="`${item.entity_type}-${item.id}`"
              class="flex items-center justify-between gap-3 py-2.5"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {{ item.name || item.code }}
                  </span>
                  <UBadge size="xs" color="neutral" variant="outline">
                    {{ item.entity_type }}
                  </UBadge>
                </div>
                <p v-if="item.modified_at" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ formatRelativeDate(item.modified_at) }}
                </p>
              </div>
              <StatusBadge type="status" :value="item.status" size="xs" />
            </div>
          </div>
        </UCard>

        <!-- Section 2: Pending Review -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-eye" class="text-warning-500" />
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ tt('features.editorial.pendingReview', 'Pending Review') }}
              </h2>
              <UBadge v-if="pendingReview.total" size="xs" color="warning" variant="subtle">
                {{ pendingReview.total }}
              </UBadge>
            </div>
          </template>

          <div v-if="pendingReview.loading" class="space-y-3">
            <USkeleton v-for="i in 3" :key="i" class="h-10 w-full" />
          </div>
          <UAlert
            v-else-if="pendingReview.error"
            color="error"
            icon="i-heroicons-exclamation-triangle"
            :description="pendingReview.error"
          />
          <div v-else-if="!pendingReview.items.length" class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {{ tt('features.editorial.noPendingReview', 'No items awaiting review.') }}
          </div>
          <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <div
              v-for="item in pendingReview.items"
              :key="`${item.entity_type}-${item.id}`"
              class="flex items-center justify-between gap-3 py-2.5"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {{ item.name || item.code }}
                  </span>
                  <UBadge size="xs" color="neutral" variant="outline">
                    {{ item.entity_type }}
                  </UBadge>
                </div>
                <p v-if="item.modified_at" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ formatRelativeDate(item.modified_at) }}
                </p>
              </div>
              <StatusBadge type="status" :value="item.status" size="xs" />
            </div>
          </div>
        </UCard>

        <!-- Section 3: Blocked Content -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-no-symbol" class="text-error-500" />
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ tt('features.editorial.blockedContent', 'Blocked Content') }}
              </h2>
              <UBadge v-if="blocked.total" size="xs" color="error" variant="subtle">
                {{ blocked.total }}
              </UBadge>
            </div>
          </template>

          <div v-if="blocked.loading" class="space-y-3">
            <USkeleton v-for="i in 3" :key="i" class="h-10 w-full" />
          </div>
          <UAlert
            v-else-if="blocked.error"
            color="error"
            icon="i-heroicons-exclamation-triangle"
            :description="blocked.error"
          />
          <div v-else-if="!blocked.items.length" class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {{ tt('features.editorial.noBlocked', 'No blocked content. Everything looks good!') }}
          </div>
          <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <div
              v-for="item in blocked.items"
              :key="`${item.entity_type}-${item.id}`"
              class="py-2.5"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {{ item.name || item.code }}
                    </span>
                    <UBadge size="xs" color="neutral" variant="outline">
                      {{ item.entity_type }}
                    </UBadge>
                  </div>
                </div>
                <StatusBadge type="status" :value="item.status" size="xs" />
              </div>
              <div
                v-if="item.editorial?.blockingReasons?.length"
                class="mt-1.5 flex flex-wrap gap-1"
              >
                <UBadge
                  v-for="(reason, idx) in item.editorial.blockingReasons"
                  :key="idx"
                  size="xs"
                  color="error"
                  variant="subtle"
                >
                  {{ reason }}
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Section 4: Open Feedback -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="text-primary-500" />
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ tt('features.editorial.openFeedback', 'Open Feedback') }}
              </h2>
              <UBadge v-if="openFeedback.total" size="xs" color="primary" variant="subtle">
                {{ openFeedback.total }}
              </UBadge>
            </div>
          </template>

          <div v-if="openFeedback.loading" class="space-y-3">
            <USkeleton v-for="i in 3" :key="i" class="h-10 w-full" />
          </div>
          <UAlert
            v-else-if="openFeedback.error"
            color="error"
            icon="i-heroicons-exclamation-triangle"
            :description="openFeedback.error"
          />
          <div v-else-if="!openFeedback.items.length" class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {{ tt('features.editorial.noFeedback', 'No open feedback items.') }}
          </div>
          <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <div
              v-for="item in openFeedback.items"
              :key="item.id"
              class="py-2.5"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {{ item.entity_code || `${item.entity_type}#${item.entity_id}` }}
                    </span>
                    <UBadge size="xs" color="neutral" variant="outline">
                      {{ item.entity_type }}
                    </UBadge>
                    <UBadge v-if="item.category" size="xs" color="primary" variant="subtle">
                      {{ item.category }}
                    </UBadge>
                  </div>
                </div>
              </div>
              <p class="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {{ item.comment }}
              </p>
              <p v-if="item.created_by_name || item.created_at" class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                <template v-if="item.created_by_name">{{ item.created_by_name }}</template>
                <template v-if="item.created_by_name && item.created_at"> · </template>
                <template v-if="item.created_at">{{ formatRelativeDate(item.created_at) }}</template>
              </p>
            </div>
          </div>

          <template v-if="openFeedback.total > openFeedback.items.length" #footer>
            <div class="flex justify-end">
              <UButton
                :to="localePath('/admin/feedback')"
                color="neutral"
                variant="link"
                size="sm"
                trailing-icon="i-heroicons-arrow-right-20-solid"
              >
                {{ tt('features.editorial.viewAllFeedback', 'View all feedback') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useEditorialDashboard } from '~/composables/manage/useEditorialDashboard'
import StatusBadge from '~/components/common/StatusBadge.vue'

definePageMeta({ layout: 'default' })

const { t, te } = useI18n()
const localePath = useLocalePath()

function tt(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}

useSeoMeta({
  title: `${tt('navigation.menu.manage', 'Manage')} · ${tt('features.editorial.dashboardTitle', 'Editorial Dashboard')}`,
})

const {
  drafts,
  pendingReview,
  blocked,
  openFeedback,
  loading,
  refresh,
} = useEditorialDashboard()

function formatRelativeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return tt('time.justNow', 'just now')
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  } catch {
    return dateStr
  }
}

onMounted(() => {
  refresh()
})
</script>
