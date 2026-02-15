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
  avatarUrl,
  relativeTime,
  type MockEntity,
} from '~/components/sketches/mockData'
import SketchCrossNav from '~/components/sketches/SketchCrossNav.vue'

definePageMeta({ layout: 'default' })

const toast = useToast()
const UBadge = resolveComponent('UBadge')
const UIcon = resolveComponent('UIcon')
const UAvatar = resolveComponent('UAvatar')

// --- Auth simulation ---
const isAuthenticated = ref(true)

// --- View mode ---
type ViewMode = 'table' | 'grid'
const viewMode = ref<ViewMode>('table')

// --- Data ---
const allEntities = ref(generateMockEntities(10))

// --- Selection (batch) ---
const selectedIds = ref<Set<number>>(new Set())
const allSelected = computed(() => selectedIds.value.size === filteredEntities.value.length && filteredEntities.value.length > 0)
function _toggleAll() {
  if (allSelected.value) { selectedIds.value = new Set() }
  else { selectedIds.value = new Set(filteredEntities.value.map(e => e.id)) }
}
function toggleOne(id: number) {
  const s = new Set(selectedIds.value)
  if (s.has(id)) s.delete(id); else s.add(id)
  selectedIds.value = s
}

function batchAction(action: string) {
  toast.add({ title: `${action}: ${selectedIds.value.size} entities`, color: 'neutral', icon: 'i-lucide-check' })
  selectedIds.value = new Set()
}

// --- Filters ---
const editorialFilter = ref<string | undefined>(undefined)
const releaseStageFilter = ref<string | undefined>(undefined)
const worldFilter = ref<string | undefined>(undefined)
const missingFrOnly = ref(false)
const hasBlockersOnly = ref(false)

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

const worldFilterOptions = computed(() => {
  const worlds = new Set<string>()
  allEntities.value.forEach(e => { if (e.world) worlds.add(e.world.name) })
  return [{ label: 'All worlds', value: '' }, { label: 'Base System', value: '__base__' }, ...Array.from(worlds).map(w => ({ label: w, value: w }))]
})

const filteredEntities = computed(() => {
  let items = allEntities.value
  if (editorialFilter.value) {
    items = items.filter(e => e.editorial_state?.status === editorialFilter.value)
  }
  if (releaseStageFilter.value) {
    items = items.filter(e => e.release_stage === releaseStageFilter.value)
  }
  if (worldFilter.value) {
    if (worldFilter.value === '__base__') items = items.filter(e => !e.world)
    else items = items.filter(e => e.world?.name === worldFilter.value)
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

function thumbnailUrl(entity: MockEntity): string {
  return entity.image ?? `https://picsum.photos/seed/${entity.code}${entity.id}/80/112`
}

// --- Table columns ---
const columns: TableColumn<MockEntity>[] = [
  {
    accessorKey: 'name',
    header: 'Entity',
    cell: ({ row }) => {
      const e = row.original
      return h('div', { class: 'flex items-center gap-2.5' }, [
        h('img', { src: thumbnailUrl(e), alt: e.name, class: 'w-8 h-11 rounded object-cover shrink-0 bg-muted/20', loading: 'lazy' }),
        h('div', { class: 'min-w-0' }, [
          h('div', { class: 'flex items-center gap-1.5' }, [
            h('span', { class: 'font-medium text-sm truncate' }, e.name),
            e.version_semver
              ? h('span', { class: 'text-[10px] text-muted tabular-nums shrink-0' }, `v${e.version_semver}`)
              : null,
            e.release_stage
              ? h('span', { class: `inline-block w-1.5 h-1.5 rounded-full shrink-0 ${releaseStageDot(e.release_stage)}`, title: releaseStageLabel(e.release_stage) })
              : null,
          ]),
          h('div', { class: 'flex items-center gap-1.5 mt-0.5' }, [
            h(UBadge, { color: 'neutral', variant: 'outline', size: 'xs' }, () => e.entity_type),
            e.world
              ? h(UBadge, { color: 'primary', variant: 'subtle', size: 'xs', icon: 'i-lucide-globe' }, () => e.world!.name)
              : h(UBadge, { color: 'neutral', variant: 'subtle', size: 'xs' }, () => 'Base System'),
          ]),
        ]),
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
        class: 'flex items-center gap-2',
        'aria-label': cov.missing.length
          ? `${cov.label} translations. Missing: ${cov.missing.join(', ')}`
          : `${cov.label} translations complete`,
      }, [
        h('span', { class: 'text-xs text-muted tabular-nums' }, cov.label),
        ...translations.map(t => {
          const complete = t.has_translation && !t.is_fallback
          return h('span', {
            class: `text-[10px] font-medium ${complete ? 'text-emerald-500' : 'text-muted/40'}`,
            title: complete ? `${t.lang.toUpperCase()}: OK` : `${t.lang.toUpperCase()}: missing`,
          }, t.lang.toUpperCase())
        }),
      ])
    },
  },
  {
    id: 'updated',
    header: 'Updated',
    cell: ({ row }) => {
      const e = row.original
      return h('div', { class: 'flex items-center gap-1.5' }, [
        h(UAvatar, { src: avatarUrl(e.updated_by), alt: e.updated_by, size: 'xs' }),
        h('div', { class: 'min-w-0' }, [
          h('span', { class: 'text-xs font-medium truncate block' }, e.updated_by),
          h('span', { class: 'text-[10px] text-muted tabular-nums' }, relativeTime(e.modified_at)),
        ]),
      ])
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
  <div class="min-h-screen bg-default flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-30 border-b border-default bg-default/95 backdrop-blur-sm">
      <div class="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <div class="flex items-center gap-3">
          <NuxtLink to="/sketches" class="text-muted hover:text-primary transition-colors" aria-label="Back to sketches">
            <UIcon name="i-lucide-arrow-left" />
          </NuxtLink>
          <h1 class="text-lg font-bold tracking-tight">Editorial List</h1>
          <UBadge color="error" variant="subtle" size="xs">POC</UBadge>
        </div>

        <div class="flex items-center gap-3">
          <!-- View mode toggle -->
          <div class="flex items-center rounded-md border border-default overflow-hidden">
            <button
              class="px-2.5 py-1.5 text-xs transition-colors"
              :class="viewMode === 'table' ? 'bg-primary text-white' : 'text-muted hover:text-primary'"
              aria-label="Table view"
              @click="viewMode = 'table'"
            >
              <UIcon name="i-lucide-table-2" />
            </button>
            <button
              class="px-2.5 py-1.5 text-xs transition-colors"
              :class="viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted hover:text-primary'"
              aria-label="Grid view"
              @click="viewMode = 'grid'"
            >
              <UIcon name="i-lucide-layout-grid" />
            </button>
          </div>

          <!-- Auth toggle -->
          <div class="flex items-center gap-1.5">
            <USwitch v-model="isAuthenticated" size="xs" color="primary" aria-label="Toggle authentication" />
            <span class="text-[10px]" :class="isAuthenticated ? 'text-primary' : 'text-muted'">{{ isAuthenticated ? 'Auth' : 'Guest' }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Cross-navigation -->
    <SketchCrossNav current-view="list" />

    <!-- 401 state -->
    <div v-if="!isAuthenticated" class="flex-1 flex items-center justify-center">
      <div class="text-center p-12">
        <UIcon name="i-lucide-shield-alert" class="text-4xl text-error mb-3" />
        <h2 class="text-lg font-semibold mb-1">401 Not Authenticated</h2>
        <p class="text-sm text-muted mb-4">Editorial data requires authentication.</p>
        <UButton label="Simulate Login" icon="i-lucide-log-in" @click="isAuthenticated = true" />
      </div>
    </div>

    <!-- Authenticated view -->
    <template v-else>
      <div class="max-w-7xl mx-auto px-4 py-6 w-full flex-1">
        <!-- Quick stats -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div class="rounded-lg border border-default p-3">
            <div class="text-[10px] text-muted uppercase tracking-wider mb-1">Drafts</div>
            <div class="text-lg font-bold tabular-nums">{{ stats.drafts }}</div>
          </div>
          <div class="rounded-lg border border-default p-3">
            <div class="text-[10px] text-muted uppercase tracking-wider mb-1">In Review</div>
            <div class="text-lg font-bold tabular-nums">{{ stats.inReview }}</div>
          </div>
          <div class="rounded-lg border border-default p-3">
            <div class="text-[10px] text-muted uppercase tracking-wider mb-1">Published</div>
            <div class="text-lg font-bold tabular-nums text-emerald-500">{{ stats.published }}</div>
          </div>
          <button
            class="rounded-lg border p-3 text-left transition-colors"
            :class="missingFrOnly ? 'border-warning bg-warning/5' : 'border-default hover:border-warning'"
            @click="missingFrOnly = !missingFrOnly"
          >
            <div class="text-[10px] text-muted uppercase tracking-wider mb-1">Missing FR</div>
            <div class="text-lg font-bold tabular-nums" :class="stats.missingFr > 0 ? 'text-warning' : ''">{{ stats.missingFr }}</div>
          </button>
          <button
            class="rounded-lg border p-3 text-left transition-colors"
            :class="hasBlockersOnly ? 'border-error bg-error/5' : 'border-default hover:border-error'"
            @click="hasBlockersOnly = !hasBlockersOnly"
          >
            <div class="text-[10px] text-muted uppercase tracking-wider mb-1">Blocked</div>
            <div class="text-lg font-bold tabular-nums" :class="stats.withBlockers > 0 ? 'text-error' : ''">{{ stats.withBlockers }}</div>
          </button>
        </div>

        <!-- Filters bar -->
        <div class="flex items-center gap-3 mb-4 flex-wrap">
          <USelect v-model="editorialFilter" :items="editorialFilterOptions" placeholder="Status" icon="i-lucide-filter" class="w-44" size="sm" aria-label="Filter by status" />
          <USelect v-model="releaseStageFilter" :items="releaseStageOptions" placeholder="Stage" icon="i-lucide-git-branch" class="w-36" size="sm" aria-label="Filter by stage" />
          <USelect v-model="worldFilter" :items="worldFilterOptions" placeholder="World" icon="i-lucide-globe" class="w-40" size="sm" aria-label="Filter by world" />

          <USwitch v-model="missingFrOnly" label="Missing FR" size="sm" color="warning" />
          <USwitch v-model="hasBlockersOnly" label="Blocked" size="sm" color="error" />

          <div class="ml-auto text-xs text-muted tabular-nums">
            {{ filteredEntities.length }} of {{ allEntities.length }}
          </div>
        </div>

        <!-- Batch actions bar -->
        <div v-if="selectedIds.size > 0" class="flex items-center gap-2 mb-4 p-2.5 rounded-lg border border-primary/30 bg-primary/5">
          <UBadge color="primary" variant="soft" size="sm">{{ selectedIds.size }} selected</UBadge>
          <UButton label="Change Status" icon="i-lucide-arrow-right-left" size="xs" variant="soft" @click="batchAction('Change status')" />
          <UButton label="Bump Version" icon="i-lucide-arrow-up-circle" size="xs" variant="soft" @click="batchAction('Bump version')" />
          <UButton label="Toggle Active" icon="i-lucide-toggle-left" size="xs" variant="soft" color="neutral" @click="batchAction('Toggle active')" />
          <UButton label="Export" icon="i-lucide-download" size="xs" variant="soft" color="neutral" @click="batchAction('Export')" />
          <UButton label="Clear" icon="i-lucide-x" size="xs" variant="ghost" color="neutral" class="ml-auto" @click="selectedIds = new Set()" />
        </div>

        <!-- ===== TABLE VIEW ===== -->
        <div v-if="viewMode === 'table'" class="rounded-lg border border-default divide-y divide-default">
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
                <p class="text-sm text-muted">No entities match the current filters.</p>
                <UButton label="Clear filters" variant="ghost" size="xs" class="mt-2" @click="editorialFilter = undefined; releaseStageFilter = undefined; worldFilter = undefined; missingFrOnly = false; hasBlockersOnly = false" />
              </div>
            </template>
          </UTable>
        </div>

        <!-- ===== GRID VIEW ===== -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div
            v-for="entity in filteredEntities"
            :key="entity.id"
            class="group rounded-xl border border-default overflow-hidden hover:border-primary/40 transition-all hover:shadow-lg cursor-pointer relative"
            :class="{ 'ring-2 ring-primary': selectedIds.has(entity.id) }"
            @click="toggleOne(entity.id)"
          >
            <!-- Card thumbnail -->
            <div class="relative" style="aspect-ratio: 2 / 3;">
              <img :src="thumbnailUrl(entity)" :alt="entity.name" class="w-full h-full object-cover" loading="lazy">
              <!-- Status overlay -->
              <div class="absolute top-2 left-2">
                <UBadge
                  :color="editorialStatusMeta(entity.status).color"
                  :variant="editorialStatusMeta(entity.status).variant"
                  size="xs"
                  class="backdrop-blur-sm shadow-sm"
                >
                  {{ editorialStatusMeta(entity.status).label }}
                </UBadge>
              </div>
              <!-- Version overlay -->
              <div v-if="entity.version_semver" class="absolute top-2 right-2">
                <div class="flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5">
                  <span class="text-[9px] text-white tabular-nums">v{{ entity.version_semver }}</span>
                  <span :class="`inline-block w-1.5 h-1.5 rounded-full ${releaseStageDot(entity.release_stage)}`" />
                </div>
              </div>
              <!-- Blockers overlay -->
              <div v-if="(entity.editorial?.blockingReasons.length ?? 0) > 0" class="absolute bottom-2 right-2">
                <div class="flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 text-warning">
                  <UIcon name="i-lucide-alert-triangle" class="text-[10px]" />
                  <span class="text-[9px]">{{ entity.editorial!.blockingReasons.length }}</span>
                </div>
              </div>
            </div>
            <!-- Card info -->
            <div class="p-2.5 space-y-1.5">
              <p class="text-xs font-semibold truncate">{{ entity.name }}</p>
              <div class="flex items-center gap-1">
                <UBadge color="neutral" variant="outline" size="xs">{{ entity.entity_type }}</UBadge>
                <UBadge v-if="entity.world" color="primary" variant="subtle" size="xs">{{ entity.world.name }}</UBadge>
                <UBadge v-else color="neutral" variant="subtle" size="xs">Base</UBadge>
              </div>
              <div class="flex items-center gap-1.5">
                <UAvatar :src="avatarUrl(entity.updated_by)" :alt="entity.updated_by" size="2xs" />
                <span class="text-[10px] text-muted">{{ relativeTime(entity.modified_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="!filteredEntities.length" class="col-span-full text-center py-16">
            <UIcon name="i-lucide-search-x" class="text-2xl text-muted mb-2" />
            <p class="text-sm text-muted">No entities match the current filters.</p>
          </div>
        </div>

        <!-- Integration notes -->
        <div class="mt-6 p-4 rounded-lg bg-muted/30 border border-default">
          <p class="text-xs text-muted leading-relaxed">
            <strong>Integration:</strong> Replace <code class="text-xs">generateMockEntities()</code> with
            <code class="text-xs">useEntity.ts</code>. Add world filter from <code class="text-xs">/api/world</code>.
            Batch actions via <code class="text-xs">useBulkActions</code> composable.
            Grid view reuses card thumbnail from entity image field.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
