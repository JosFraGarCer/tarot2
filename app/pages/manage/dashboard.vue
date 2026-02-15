<!-- app/pages/manage/dashboard.vue -->
<template>
  <div class="px-4 py-6">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <!-- Header -->
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ tt('features.editorial.dashboardTitle', 'Editorial Dashboard') }}
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {{ tt('features.editorial.dashboardSubtitle', 'Overview of your editorial work, pending reviews and blocked content.') }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <!-- World filter -->
          <USelectMenu
            v-if="worldOptions.length"
            v-model="selectedWorldId"
            :items="worldFilterItems"
            value-key="value"
            size="sm"
            class="w-40"
          />

          <UButton
            icon="i-heroicons-arrow-path"
            color="neutral"
            variant="soft"
            size="sm"
            :loading="loading"
            :aria-label="tt('ui.actions.refresh', 'Refresh')"
            @click="refresh"
          />

          <UButton
            icon="i-heroicons-view-columns"
            color="primary"
            variant="soft"
            size="sm"
            :label="tt('navigation.menu.board', 'Editorial Board')"
            :to="localePath('/manage/board')"
          />
        </div>
      </header>

      <!-- Error -->
      <UAlert
        v-if="error"
        color="error"
        icon="i-heroicons-exclamation-triangle"
        :description="error"
      />

      <!-- Loading -->
      <div v-if="loading && !allEntities.length" class="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <UCard v-for="i in 5" :key="i">
          <template #header>
            <USkeleton class="h-5 w-32" />
          </template>
          <div class="space-y-3">
            <USkeleton v-for="j in 3" :key="j" class="h-14 w-full" />
          </div>
        </UCard>
      </div>

      <!-- Status sections -->
      <div v-else class="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <UCard
          v-for="status in dashboardStatuses"
          :key="status"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon :name="sectionIcon(status)" :class="sectionIconColor(status)" />
                <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
                  {{ sectionLabel(status) }}
                </h2>
                <UBadge
                  v-if="grouped[status]?.length"
                  size="xs"
                  :color="sectionBadgeColor(status)"
                  variant="subtle"
                >
                  {{ grouped[status].length }}
                </UBadge>
              </div>
            </div>
          </template>

          <div
            v-if="!grouped[status]?.length"
            class="py-4 text-center text-xs text-gray-400 dark:text-gray-500 italic"
          >
            {{ tt('features.editorial.emptySection', 'No items') }}
          </div>

          <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <div
              v-for="item in grouped[status].slice(0, SECTION_LIMIT)"
              :key="`${item.entity_type}-${item.id}`"
              class="flex items-start gap-2.5 py-2"
            >
              <!-- Thumbnail -->
              <div class="shrink-0 w-8 h-11 rounded overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.name"
                  class="w-full h-full object-cover"
                >
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-photo" class="text-neutral-300 dark:text-neutral-600 size-3" />
                </div>
              </div>

              <!-- Info -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <span class="truncate text-xs font-medium text-gray-900 dark:text-white">
                    {{ item.name || item.code }}
                  </span>
                  <UBadge size="xs" color="neutral" variant="outline">
                    {{ entityTypeLabel(item.entity_type) }}
                  </UBadge>
                </div>
                <div class="mt-0.5 flex flex-wrap items-center gap-1">
                  <UBadge
                    v-if="item.version_semver"
                    size="xs"
                    color="neutral"
                    variant="subtle"
                  >
                    {{ item.version_semver }}
                  </UBadge>
                  <UBadge
                    v-if="item.world_name"
                    size="xs"
                    color="primary"
                    variant="subtle"
                  >
                    {{ item.world_name }}
                  </UBadge>
                  <span
                    v-if="item.modified_at"
                    class="text-[10px] text-gray-400 dark:text-gray-500"
                  >
                    {{ formatRelativeDate(item.modified_at) }}
                  </span>
                </div>
              </div>

              <!-- Studio link -->
              <UButton
                v-if="studioPath(item)"
                icon="i-heroicons-pencil-square"
                color="neutral"
                variant="ghost"
                size="xs"
                :to="studioPath(item)"
                :aria-label="`Open ${item.name} in studio`"
              />
            </div>
          </div>

          <template v-if="grouped[status]?.length > SECTION_LIMIT" #footer>
            <div class="text-center">
              <span class="text-xs text-gray-400">
                +{{ grouped[status].length - SECTION_LIMIT }} {{ tt('features.editorial.moreItems', 'more') }}
              </span>
            </div>
          </template>
        </UCard>
      </div>

      <!-- Summary bar -->
      <div
        v-if="allEntities.length"
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>
            <strong class="text-gray-900 dark:text-white">{{ allEntities.length }}</strong>
            {{ tt('features.editorial.totalEntities', 'total entities') }}
          </span>
          <span v-for="status in dashboardStatuses" :key="status">
            <UBadge
              size="xs"
              :color="sectionBadgeColor(status)"
              variant="subtle"
            >
              {{ grouped[status]?.length ?? 0 }}
            </UBadge>
            {{ sectionLabel(status) }}
          </span>
        </div>
        <UButton
          icon="i-heroicons-view-columns"
          color="neutral"
          variant="link"
          size="xs"
          :to="localePath('/manage/board')"
          trailing-icon="i-heroicons-arrow-right-20-solid"
        >
          {{ tt('navigation.menu.board', 'Editorial Board') }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useEditorialDashboard } from '~/composables/manage/useEditorialDashboard'
import type { DashboardEntity, DashboardStatus } from '~/composables/manage/useEditorialDashboard'

definePageMeta({ layout: 'default' })

const { t, te } = useI18n()
const localePath = useLocalePath()

function tt(key: string, fallback: string): string {
  return te(key) ? t(key) : fallback
}

useSeoMeta({
  title: `${tt('navigation.menu.manage', 'Manage')} · ${tt('features.editorial.dashboardTitle', 'Editorial Dashboard')}`,
})

const SECTION_LIMIT = 8

const {
  allEntities,
  loading,
  error,
  filters,
  grouped,
  worldOptions,
  dashboardStatuses,
  entityEndpoints,
  refresh,
} = useEditorialDashboard()

// --- World filter ---
const selectedWorldId = computed({
  get: () => filters.worldId != null ? String(filters.worldId) : '',
  set: (val: string) => {
    filters.worldId = val ? Number(val) : null
  },
})

const worldFilterItems = computed(() => [
  { label: tt('ui.filters.allWorlds', 'All worlds'), value: '' },
  ...worldOptions.value.map(w => ({ label: w.label, value: String(w.value) })),
])

// --- Entity type mapping for API path resolution ---
const ENTITY_API_MAP: Record<string, string> = {
  base_card: 'baseCard',
  arcana: 'arcana',
  facet: 'facet',
  world: 'world',
  skill: 'skill',
  card_type: 'cardType',
}

function entityTypeLabel(type: string): string {
  const ep = entityEndpoints.find(e => e.key === type)
  return ep?.label ?? type
}

function studioPath(item: DashboardEntity): string | undefined {
  const routeKey = ENTITY_API_MAP[item.entity_type]
  if (!routeKey) return undefined
  return localePath(`/manage/${routeKey}/${item.id}/studio`)
}

// --- Section display helpers ---
const SECTION_META: Record<DashboardStatus, { icon: string; iconColor: string; badgeColor: 'neutral' | 'warning' | 'primary' | 'success' | 'error'; label: string }> = {
  draft: { icon: 'i-heroicons-pencil-square', iconColor: 'text-neutral-500', badgeColor: 'neutral', label: 'Draft' },
  review: { icon: 'i-heroicons-eye', iconColor: 'text-warning-500', badgeColor: 'warning', label: 'Review' },
  changes_requested: { icon: 'i-heroicons-arrow-uturn-left', iconColor: 'text-warning-500', badgeColor: 'warning', label: 'Changes Requested' },
  approved: { icon: 'i-heroicons-check-circle', iconColor: 'text-primary-500', badgeColor: 'primary', label: 'Approved' },
  published: { icon: 'i-heroicons-globe-alt', iconColor: 'text-success-500', badgeColor: 'success', label: 'Published' },
}

function sectionIcon(status: DashboardStatus): string {
  return SECTION_META[status].icon
}

function sectionIconColor(status: DashboardStatus): string {
  return SECTION_META[status].iconColor
}

function sectionBadgeColor(status: DashboardStatus): 'neutral' | 'warning' | 'primary' | 'success' | 'error' {
  return SECTION_META[status].badgeColor
}

function sectionLabel(status: DashboardStatus): string {
  const key = `system.status.${status}`
  return te(key) ? t(key) : SECTION_META[status].label
}

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
