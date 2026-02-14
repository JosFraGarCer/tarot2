<!--
  /pages/sketches/editorial-list.vue
  POC 1: Editorial List with editorial_state visibility

  OBJECTIVE:
  Show editorial_state.status, translation coverage, and updated_by in entity list.
  Provide filters by editorial status and "missing FR" toggle.
  Auth toggle simulates 401 vs authenticated editor view.

  SUCCESS CRITERIA:
  - Editor can identify all entities needing review without opening any
  - "Find entities needing FR translation" = 1 click (filter)
  - Click count for "scan editorial health" goes from N+1 to 0

  INTEGRATION INTO /manage:
  1. Add editorial_state column to useManageColumns.ts (accessorKey: 'editorial_state')
  2. Add translation coverage column (computed from translation_state API field)
  3. Add editorial status filter to EntityFilters.vue
  4. Replace mock data with useEntity.ts composable (items already have editorial_state)
  5. Reuse StatusBadge component (type='status') for editorial badges
-->
<script setup lang="ts">
import { ref, computed, h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import {
  generateMockEntities,
  editorialStatusMeta,
  translationCoverage,
  releaseStageDot,
  releaseStageLabel,
  translationStatusDot,
  type MockEntity,
} from '~/components/sketches/mockData'

definePageMeta({ layout: 'default' })

const UBadge = resolveComponent('UBadge')

// --- Auth simulation ---
const isAuthenticated = ref(true)

// --- Data ---
const allEntities = ref(generateMockEntities(10))

// --- Filters ---
const editorialFilter = ref<string | undefined>(undefined)
const releaseStageFilter = ref<string | undefined>(undefined)
const missingFrOnly = ref(false)
const hasBlockersOnly = ref(false)

const UIcon = resolveComponent('UIcon')

const editorialFilterOptions = [
  { label: 'All statuses', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Review', value: 'review' },
  { label: 'Changes Requested', value: 'changes_requested' },
  { label: 'Translation Review', value: 'translation_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Published', value: 'published' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Archived', value: 'archived' },
]

const releaseStageOptions = [
  { label: 'All stages', value: '' },
  { label: 'Dev', value: 'dev' },
  { label: 'Alfa', value: 'alfa' },
  { label: 'Beta', value: 'beta' },
  { label: 'Candidate', value: 'candidate' },
  { label: 'Release', value: 'release' },
  { label: 'Revision', value: 'revision' },
]

const filteredEntities = computed(() => {
  let items = allEntities.value
  if (editorialFilter.value) {
    items = items.filter(e => e.editorial_state?.status === editorialFilter.value)
  }
  if (releaseStageFilter.value) {
    items = items.filter(e => e.release_stage === releaseStageFilter.value)
  }
  if (missingFrOnly.value) {
    items = items.filter(e => {
      const fr = e.translations.find(t => t.lang === 'fr')
      return fr && (!fr.has_translation || fr.is_fallback)
    })
  }
  if (hasBlockersOnly.value) {
    items = items.filter(e => (e.editorial?.blockingReasons.length ?? 0) > 0)
  }
  return items
})

// --- Table columns ---
const columns: TableColumn<MockEntity>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium text-sm' }, row.original.name),
        h('span', { class: 'text-xs text-muted' }, `#${row.original.code}`),
      ])
    },
  },
  {
    accessorKey: 'entity_type',
    header: 'Type',
    cell: ({ row }) => {
      return h(UBadge, {
        color: 'neutral',
        variant: 'outline',
        size: 'xs',
      }, () => row.original.entity_type)
    },
  },
  {
    id: 'version',
    header: 'Version',
    cell: ({ row }) => {
      const e = row.original
      if (!e.version_semver) return h('span', { class: 'text-xs text-muted italic' }, '—')
      const dotClass = releaseStageDot(e.release_stage)
      const stageLabel = releaseStageLabel(e.release_stage)
      return h('div', { class: 'flex items-center gap-1.5', title: `${e.version_semver} (${stageLabel})` }, [
        h(UBadge, { color: 'neutral', variant: 'outline', size: 'xs' }, () => `v${e.version_semver}`),
        h('span', { class: `inline-block w-2 h-2 rounded-full shrink-0 ${dotClass}`, 'aria-label': stageLabel }),
      ])
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const meta = editorialStatusMeta(row.original.status)
      return h(UBadge, {
        color: meta.color,
        variant: meta.variant,
        icon: meta.icon,
        size: 'xs',
        'aria-label': `Status: ${meta.label}`,
      }, () => meta.label)
    },
  },
  {
    id: 'health',
    header: 'Health',
    cell: ({ row }) => {
      const e = row.original
      const hasImage = !!e.image
      const hasEffects = !e.editorial?.blockingReasons.some((r: string) => r.includes('effects'))
      const blockers = e.editorial?.blockingReasons.length ?? 0
      return h('div', { class: 'flex items-center gap-1', title: blockers > 0 ? e.editorial!.blockingReasons.join('\n') : 'No blockers' }, [
        h(UIcon, { name: hasImage ? 'i-lucide-image' : 'i-lucide-image-off', class: `text-xs ${hasImage ? 'text-emerald-500' : 'text-red-400'}` }),
        h(UIcon, { name: hasEffects ? 'i-lucide-zap' : 'i-lucide-zap-off', class: `text-xs ${hasEffects ? 'text-emerald-500' : 'text-red-400'}` }),
        blockers > 0
          ? h('span', { class: 'inline-flex items-center gap-0.5 text-[10px] text-warning ml-0.5' }, [
              h(UIcon, { name: 'i-lucide-alert-triangle', class: 'text-[10px]' }),
              String(blockers),
            ])
          : h(UIcon, { name: 'i-lucide-check-circle', class: 'text-xs text-emerald-500 ml-0.5' }),
      ])
    },
  },
  {
    id: 'translations',
    header: 'Translations',
    cell: ({ row }) => {
      const translations = row.original.translations
      const cov = translationCoverage(translations)
      return h('div', {
        class: 'flex items-center gap-1',
        'aria-label': cov.missing.length
          ? `${cov.label} translations. Missing: ${cov.missing.join(', ')}`
          : `${cov.label} translations complete`,
      }, translations.map(t => {
        const dotInfo = translationStatusDot(t.status)
        const tooltipText = t.has_translation && !t.is_fallback
          ? `${t.lang.toUpperCase()}: ${dotInfo.label}${t.updated_by ? ` · ${t.updated_by}` : ''}`
          : `${t.lang.toUpperCase()}: missing (fallback)`
        return h('span', {
          class: 'flex items-center gap-0.5',
          title: tooltipText,
        }, [
          h('span', { class: `inline-block w-1.5 h-1.5 rounded-full ${dotInfo.dot}` }),
          h('span', { class: 'text-[10px] text-muted' }, t.lang.toUpperCase()),
        ])
      }))
    },
  },
  {
    accessorKey: 'updated_by',
    header: 'Updated By',
    cell: ({ row }) => {
      return h('span', { class: 'text-sm' }, row.original.updated_by)
    },
  },
  {
    accessorKey: 'modified_at',
    header: 'Updated',
    cell: ({ row }) => {
      const d = new Date(row.original.modified_at)
      return h('span', { class: 'text-xs text-muted tabular-nums' }, d.toLocaleDateString('en', { month: 'short', day: 'numeric' }))
    },
  },
]

// --- Stats ---
const stats = computed(() => {
  const items = allEntities.value
  const drafts = items.filter(e => e.editorial_state?.status === 'draft').length
  const inReview = items.filter(e => ['pending_review', 'review', 'translation_review'].includes(e.editorial_state?.status ?? '')).length
  const published = items.filter(e => e.editorial_state?.status === 'published').length
  const missingFr = items.filter(e => {
    const fr = e.translations.find(t => t.lang === 'fr')
    return fr && (!fr.has_translation || fr.is_fallback)
  }).length
  const withBlockers = items.filter(e => (e.editorial?.blockingReasons.length ?? 0) > 0).length
  return { drafts, inReview, published, missingFr, withBlockers }
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-2">
          <NuxtLink
            to="/sketches"
            class="text-muted hover:text-primary transition-colors"
            aria-label="Back to sketches"
          >
            <UIcon name="i-lucide-arrow-left" />
          </NuxtLink>
          <h1 class="text-xl font-bold tracking-tight">
            Editorial List
          </h1>
          <UBadge color="error" variant="subtle" size="xs">
            POC
          </UBadge>
        </div>
        <p class="text-xs text-muted mt-1 ml-6">
          Entity list with editorial_state visibility, translation coverage, and editorial filters.
        </p>
      </div>

      <!-- Auth toggle -->
      <div class="flex items-center gap-2">
        <USwitch
          v-model="isAuthenticated"
          :unchecked-icon="'i-lucide-lock'"
          :checked-icon="'i-lucide-unlock'"
          color="primary"
          aria-label="Toggle authentication simulation"
        />
        <span class="text-xs font-medium" :class="isAuthenticated ? 'text-primary' : 'text-muted'">
          {{ isAuthenticated ? 'Authenticated' : 'Guest' }}
        </span>
      </div>
    </div>

    <!-- 401 state -->
    <div v-if="!isAuthenticated" class="rounded-lg border border-default p-12 text-center">
      <UIcon name="i-lucide-shield-alert" class="text-4xl text-error mb-3" />
      <h2 class="text-lg font-semibold mb-1">
        401 Not Authenticated
      </h2>
      <p class="text-sm text-muted mb-4">
        Editorial data requires authentication. Please log in to access the entity list.
      </p>
      <UButton
        label="Simulate Login"
        icon="i-lucide-log-in"
        @click="isAuthenticated = true"
      />
    </div>

    <!-- Authenticated view -->
    <template v-else>
      <!-- Quick stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div class="rounded-lg border border-default p-3">
          <div class="text-xs text-muted mb-1">
            Drafts
          </div>
          <div class="text-lg font-bold tabular-nums">
            {{ stats.drafts }}
          </div>
        </div>
        <div class="rounded-lg border border-default p-3">
          <div class="text-xs text-muted mb-1">
            In Review
          </div>
          <div class="text-lg font-bold tabular-nums">
            {{ stats.inReview }}
          </div>
        </div>
        <div class="rounded-lg border border-default p-3">
          <div class="text-xs text-muted mb-1">
            Published
          </div>
          <div class="text-lg font-bold tabular-nums">
            {{ stats.published }}
          </div>
        </div>
        <button
          class="rounded-lg border p-3 text-left transition-colors"
          :class="missingFrOnly ? 'border-warning bg-warning/5' : 'border-default hover:border-warning'"
          :aria-pressed="missingFrOnly"
          aria-label="Toggle filter: show only entities missing French translation"
          @click="missingFrOnly = !missingFrOnly"
        >
          <div class="text-xs text-muted mb-1">
            Missing FR
          </div>
          <div class="text-lg font-bold tabular-nums" :class="stats.missingFr > 0 ? 'text-warning' : ''">
            {{ stats.missingFr }}
          </div>
        </button>
      </div>

      <!-- Filters bar -->
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <USelect
          v-model="editorialFilter"
          :items="editorialFilterOptions"
          placeholder="Filter by editorial status"
          icon="i-lucide-filter"
          class="w-48"
          size="sm"
          aria-label="Filter by editorial status"
        />

        <USelect
          v-model="releaseStageFilter"
          :items="releaseStageOptions"
          placeholder="Filter by stage"
          icon="i-lucide-git-branch"
          class="w-40"
          size="sm"
          aria-label="Filter by release stage"
        />

        <USwitch
          v-model="missingFrOnly"
          label="Missing FR only"
          size="sm"
          color="warning"
          aria-label="Show only entities missing French translation"
        />

        <USwitch
          v-model="hasBlockersOnly"
          label="Has blockers"
          size="sm"
          color="error"
          aria-label="Show only entities with blocking reasons"
        />

        <div class="ml-auto text-xs text-muted tabular-nums">
          {{ filteredEntities.length }} of {{ allEntities.length }} entities
        </div>
      </div>

      <!-- Table -->
      <div class="rounded-lg border border-default divide-y divide-default">
        <UTable
          :data="filteredEntities"
          :columns="columns"
          class="w-full"
          :ui="{
            th: 'text-xs font-medium text-muted uppercase tracking-wider',
            td: 'py-2.5',
          }"
        >
          <template #empty>
            <div class="text-center py-8">
              <UIcon name="i-lucide-search-x" class="text-2xl text-muted mb-2" />
              <p class="text-sm text-muted">
                No entities match the current filters.
              </p>
              <UButton
                label="Clear filters"
                variant="ghost"
                size="xs"
                class="mt-2"
                @click="editorialFilter = undefined; releaseStageFilter = undefined; missingFrOnly = false; hasBlockersOnly = false"
              />
            </div>
          </template>
        </UTable>
      </div>

      <!-- Integration notes -->
      <div class="mt-6 p-4 rounded-lg bg-muted/30 border border-default">
        <p class="text-xs text-muted leading-relaxed">
          <strong>Integration:</strong> Replace <code class="text-xs">generateMockEntities()</code> with
          <code class="text-xs">useEntity.ts</code> composable. The <code class="text-xs">editorial_state</code>
          field is already present in API LIST responses (eager-loaded). Add columns to
          <code class="text-xs">useManageColumns.ts</code> and filters to
          <code class="text-xs">EntityFilters.vue</code>.
        </p>
      </div>
    </template>
  </div>
</template>
