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
const missingFrOnly = ref(false)

const editorialFilterOptions = [
  { label: 'All statuses', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Review', value: 'review' },
  { label: 'Translation Review', value: 'translation_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Published', value: 'published' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Archived', value: 'archived' },
]

const filteredEntities = computed(() => {
  let items = allEntities.value
  if (editorialFilter.value) {
    items = items.filter(e => e.editorial_state?.status === editorialFilter.value)
  }
  if (missingFrOnly.value) {
    items = items.filter(e => {
      const fr = e.translations.find(t => t.lang === 'fr')
      return fr && (!fr.has_translation || fr.is_fallback)
    })
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
    id: 'editorial_status',
    header: 'Editorial State',
    cell: ({ row }) => {
      const es = row.original.editorial_state
      if (!es) {
        return h('span', { class: 'text-xs text-muted italic' }, 'No state')
      }
      const meta = editorialStatusMeta(es.status)
      return h('div', { class: 'flex flex-col gap-0.5' }, [
        h(UBadge, {
          color: meta.color,
          variant: meta.variant,
          icon: meta.icon,
          size: 'xs',
          'aria-label': `Editorial state: ${meta.label}`,
        }, () => meta.label),
        es.updated_by
          ? h('span', { class: 'text-[10px] text-muted' }, `by ${es.updated_by}`)
          : null,
      ])
    },
  },
  {
    id: 'translations',
    header: 'Translations',
    cell: ({ row }) => {
      const cov = translationCoverage(row.original.translations)
      const color = cov.done === cov.total ? 'success' : cov.done === 0 ? 'error' : 'warning'
      const ariaLabel = cov.missing.length
        ? `${cov.label} translations complete. Missing: ${cov.missing.join(', ')}`
        : `${cov.label} translations complete`
      return h('div', { class: 'flex items-center gap-1.5' }, [
        h(UBadge, {
          color,
          variant: 'soft',
          size: 'xs',
          'aria-label': ariaLabel,
        }, () => cov.label),
        cov.missing.length
          ? h('span', {
              class: 'text-[10px] text-muted',
              title: `Missing: ${cov.missing.join(', ')}`,
            }, cov.missing.join(', '))
          : null,
      ])
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
  return { drafts, inReview, published, missingFr }
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
          class="w-56"
          size="sm"
          aria-label="Filter by editorial status"
        />

        <USwitch
          v-model="missingFrOnly"
          label="Missing FR only"
          size="sm"
          color="warning"
          aria-label="Show only entities missing French translation"
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
                @click="editorialFilter = undefined; missingFrOnly = false"
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
