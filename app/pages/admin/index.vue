<!-- app/pages/admin/index.vue -->
<template>
  <div class="px-4 py-6">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ tt('features.admin.dashboardTitle', 'Administration') }}
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {{ tt('features.admin.dashboardSubtitle', 'Choose a workspace to manage users, releases, feedback or data exports.') }}
          </p>
        </div>
      </header>

      <div class="grid gap-4 sm:grid-cols-2">
        <UCard
          v-for="section in sections"
          :key="section.key"
          class="h-full"
        >
          <div class="flex h-full flex-col gap-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ section.title }}
                </h2>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {{ section.description }}
                </p>
              </div>
              <div v-if="section.icon" class="rounded-full bg-primary-100 p-2 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300">
                <UIcon :name="section.icon" class="h-5 w-5" />
              </div>
            </div>

            <ul v-if="section.highlights?.length" class="flex flex-1 list-disc flex-col gap-1 pl-5 text-sm text-gray-500 dark:text-gray-400">
              <li v-for="item in section.highlights" :key="item">
                {{ item }}
              </li>
            </ul>

            <div class="flex justify-end">
              <UButton :to="localePath(section.href)" color="primary" variant="soft" trailing-icon="i-heroicons-arrow-right-20-solid">
                {{ section.actionLabel }}
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({ layout: 'default' })

const { t, te } = useI18n()
const localePath = useLocalePath()

function tt(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}

const pageTitle = computed(() => `${tt('navigation.menu.admin', 'Admin')} · ${tt('features.admin.dashboardTitle', 'Administration')}`)

useSeoMeta(() => ({
  title: pageTitle.value,
}))

const sections = computed(() => [
  {
    key: 'users',
    icon: 'i-heroicons-users-20-solid',
    title: tt('features.admin.usersTitle', 'Users'),
    description: tt('features.admin.usersSummary', 'Invite, disable or update staff accounts and roles.'),
    highlights: [
      tt('features.admin.usersHighlight1', 'Assign admin/editor capabilities'),
      tt('features.admin.usersHighlight2', 'Reset passwords or disable access quickly'),
    ],
    href: '/admin/users',
    actionLabel: tt('features.admin.usersCta', 'Manage users'),
  },
  {
    key: 'versions',
    icon: 'i-heroicons-rocket-launch-20-solid',
    title: tt('features.admin.versionsTitle', 'Versions'),
    description: tt('features.admin.versionsSummary', 'Prepare releases, inspect metadata and publish approved revisions.'),
    highlights: [
      tt('features.admin.versionsHighlight1', 'Review pending revisions and metadata'),
      tt('features.admin.versionsHighlight2', 'Trigger guided publish flows'),
    ],
    href: '/admin/versions',
    actionLabel: tt('features.admin.versionsCta', 'Open versions'),
  },
  {
    key: 'feedback',
    icon: 'i-heroicons-chat-bubble-left-ellipsis-20-solid',
    title: tt('features.admin.feedbackTitle', 'Feedback'),
    description: tt('features.admin.feedbackSummary', 'Filter, resolve or reopen player feedback with advanced filters.'),
    highlights: [
      tt('features.admin.feedbackHighlight1', 'Segment by status, type and date ranges'),
      tt('features.admin.feedbackHighlight2', 'Preview linked entities before resolving'),
    ],
    href: '/admin/feedback',
    actionLabel: tt('features.admin.feedbackCta', 'Review feedback'),
  },
  {
    key: 'database',
    icon: 'i-heroicons-server-stack-20-solid',
    title: tt('features.admin.databaseTitle', 'Database'),
    description: tt('features.admin.databaseSummary', 'Run manual exports or imports in JSON/SQL for recovery.'),
    highlights: [
      tt('features.admin.databaseHighlight1', 'Download full snapshots in JSON or SQL'),
      tt('features.admin.databaseHighlight2', 'Restore data from supervised imports'),
    ],
    href: '/admin/database',
    actionLabel: tt('features.admin.databaseCta', 'Open database tools'),
  },
])

defineExpose({ sections })
</script>
