<!--
  /pages/sketches/dashboard-v2.vue
  POC 6: Editorial dashboard using editorial_state from list endpoints

  OBJECTIVE:
  Single API call per entity type (list with editorial_state eager-loaded).
  Group by editorial status across all entity types.
  Show translation completeness per entity type.

  SUCCESS CRITERIA:
  - Dashboard loads with fewer API calls (1 per entity type vs 12+ currently)
  - Shows cross-entity editorial health at a glance
  - Translation completeness visible per entity type

  INTEGRATION INTO /manage/dashboard:
  1. Replace useEditorialDashboard's N×M fetch pattern with single list calls
  2. Use editorial_state from list response (already eager-loaded)
  3. Group entities client-side by editorial_state.status
  4. Add translation completeness summary per entity type
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  generateMockEntities,
  editorialStatusMeta,
  translationCoverage,
  avatarUrl,
  relativeTime,
  type MockEntity,
  type EditorialStatus,
} from '~/components/sketches/mockData'
import SketchCrossNav from '~/components/sketches/SketchCrossNav.vue'

definePageMeta({ layout: 'default' })

const isAuthenticated = ref(true)
const toast = useToast()

// Simulate fetching all entities in a single batch (1 call per entity type)
const allEntities = ref(generateMockEntities(24))

// --- World filter ---
const selectedWorld = ref<string>('all')
const worldOptions = computed(() => {
  const worlds = new Set<string>()
  for (const e of allEntities.value) {
    if (e.world) worlds.add(e.world.name)
  }
  return [{ label: 'All Worlds', value: 'all' }, ...Array.from(worlds).sort().map(w => ({ label: w, value: w }))]
})
const filteredEntities = computed(() => {
  if (selectedWorld.value === 'all') return allEntities.value
  return allEntities.value.filter(e => e.world?.name === selectedWorld.value)
})

// --- Grouped by editorial status ---
const statusGroups = computed(() => {
  const groups: Record<string, { label: string; color: string; icon: string; entities: MockEntity[] }> = {}
  const order: EditorialStatus[] = ['draft', 'pending_review', 'review', 'translation_review', 'approved', 'published', 'rejected', 'archived']

  for (const status of order) {
    const meta = editorialStatusMeta(status)
    groups[status] = {
      label: meta.label,
      color: meta.color,
      icon: meta.icon,
      entities: [],
    }
  }

  for (const entity of filteredEntities.value) {
    const status = entity.editorial_state?.status ?? 'draft'
    if (groups[status]) {
      groups[status].entities.push(entity)
    }
  }

  return order
    .map(status => ({ status, ...groups[status] }))
    .filter(g => g.entities.length > 0)
})

// --- Translation completeness per entity type ---
const entityTypeSummary = computed(() => {
  const types = new Map<string, { total: number; fullyTranslated: number; missingLangs: Set<string> }>()

  for (const entity of filteredEntities.value) {
    if (!types.has(entity.entity_type)) {
      types.set(entity.entity_type, { total: 0, fullyTranslated: 0, missingLangs: new Set() })
    }
    const summary = types.get(entity.entity_type)!
    summary.total++
    const cov = translationCoverage(entity.translations)
    if (cov.done === cov.total) {
      summary.fullyTranslated++
    }
    for (const lang of cov.missing) {
      summary.missingLangs.add(lang)
    }
  }

  return Array.from(types.entries()).map(([type, data]) => ({
    type,
    ...data,
    missingLangs: Array.from(data.missingLangs),
    percentage: data.total > 0 ? Math.round((data.fullyTranslated / data.total) * 100) : 0,
  }))
})

// --- Quick stats ---
const stats = computed(() => {
  const ents = filteredEntities.value
  const total = ents.length
  const needsAction = ents.filter(e =>
    ['draft', 'pending_review', 'rejected'].includes(e.editorial_state?.status ?? '')
  ).length
  const inReview = ents.filter(e =>
    ['review', 'translation_review'].includes(e.editorial_state?.status ?? '')
  ).length
  const published = ents.filter(e =>
    e.editorial_state?.status === 'published'
  ).length
  const blocked = ents.filter(e =>
    (e.editorial?.blockingReasons.length ?? 0) > 0
  ).length
  const missingTranslations = ents.filter(e => {
    const cov = translationCoverage(e.translations)
    return cov.done < cov.total
  }).length
  return { total, needsAction, inReview, published, blocked, missingTranslations }
})

// --- Top blocked entities ---
const topBlocked = computed(() => {
  return filteredEntities.value
    .filter(e => (e.editorial?.blockingReasons.length ?? 0) > 0)
    .sort((a, b) => (b.editorial?.blockingReasons.length ?? 0) - (a.editorial?.blockingReasons.length ?? 0))
    .slice(0, 5)
})

// --- Recent transitions (simulated) ---
const recentTransitions = computed(() => {
  return filteredEntities.value
    .filter(e => e.editorial_state?.updated_at)
    .sort((a, b) => new Date(b.editorial_state!.updated_at!).getTime() - new Date(a.editorial_state!.updated_at!).getTime())
    .slice(0, 6)
    .map(e => ({
      entity: e,
      status: e.editorial_state!.status,
      by: e.editorial_state!.updated_by ?? e.updated_by,
      at: e.editorial_state!.updated_at ?? e.modified_at,
    }))
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
          <h1 class="text-lg font-bold tracking-tight">Dashboard v2</h1>
          <UBadge color="warning" variant="subtle" size="xs">P1</UBadge>
        </div>
        <div class="flex items-center gap-3">
          <USelect v-model="selectedWorld" :items="worldOptions" size="xs" class="w-36" aria-label="Filter by world" />
          <USwitch v-model="isAuthenticated" size="xs" color="primary" aria-label="Toggle authentication" />
        </div>
      </div>
    </header>

    <SketchCrossNav current-view="" />

    <!-- 401 state -->
    <div v-if="!isAuthenticated" class="flex-1 flex items-center justify-center">
      <div class="text-center p-12">
        <UIcon name="i-lucide-shield-alert" class="text-4xl text-error mb-3" />
        <h2 class="text-lg font-semibold mb-1">401 Not Authenticated</h2>
        <p class="text-sm text-muted mb-4">Dashboard requires authentication.</p>
        <UButton label="Simulate Login" icon="i-lucide-log-in" @click="isAuthenticated = true" />
      </div>
    </div>

    <template v-else>
      <div class="max-w-7xl mx-auto px-4 py-6 w-full flex-1">
        <!-- Quick actions bar -->
        <div class="flex items-center gap-2 mb-5">
          <UButton label="Create Entity" icon="i-lucide-plus" size="xs" @click="toast.add({ title: 'Open Create Flow', icon: 'i-lucide-plus' })" />
          <UButton label="Board" icon="i-lucide-kanban" size="xs" variant="outline" @click="toast.add({ title: 'Open Editorial Board', icon: 'i-lucide-kanban' })" />
          <UButton label="Studio" icon="i-lucide-palette" size="xs" variant="outline" @click="toast.add({ title: 'Open Studio', icon: 'i-lucide-palette' })" />
          <UButton label="Bulk Actions" icon="i-lucide-layers" size="xs" variant="ghost" @click="toast.add({ title: 'Open Bulk Actions', icon: 'i-lucide-layers' })" />
        </div>

        <!-- Quick stats row -->
        <div class="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
          <div class="rounded-lg border border-default p-3">
            <div class="text-[10px] text-muted mb-1">Total</div>
            <div class="text-xl font-bold tabular-nums">{{ stats.total }}</div>
          </div>
          <div class="rounded-lg border border-default p-3">
            <div class="text-[10px] text-muted mb-1">Needs Action</div>
            <div class="text-xl font-bold tabular-nums" :class="stats.needsAction > 0 ? 'text-warning' : ''">{{ stats.needsAction }}</div>
          </div>
          <div class="rounded-lg border border-default p-3">
            <div class="text-[10px] text-muted mb-1">In Review</div>
            <div class="text-xl font-bold tabular-nums">{{ stats.inReview }}</div>
          </div>
          <div class="rounded-lg border border-default p-3">
            <div class="text-[10px] text-muted mb-1">Published</div>
            <div class="text-xl font-bold tabular-nums text-success">{{ stats.published }}</div>
          </div>
          <div class="rounded-lg border border-default p-3">
            <div class="text-[10px] text-muted mb-1">Blocked</div>
            <div class="text-xl font-bold tabular-nums" :class="stats.blocked > 0 ? 'text-error' : ''">{{ stats.blocked }}</div>
          </div>
          <div class="rounded-lg border border-default p-3">
            <div class="text-[10px] text-muted mb-1">Missing i18n</div>
            <div class="text-xl font-bold tabular-nums" :class="stats.missingTranslations > 0 ? 'text-error' : ''">{{ stats.missingTranslations }}</div>
          </div>
        </div>

        <!-- Three-column layout -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Status groups (5/12) -->
          <div class="lg:col-span-5 space-y-4">
            <h2 class="text-sm font-semibold">By Editorial Status</h2>
            <div
              v-for="group in statusGroups"
              :key="group.status"
              class="rounded-lg border border-default"
            >
              <div class="flex items-center justify-between px-3 py-2 border-b border-default bg-muted/20">
                <div class="flex items-center gap-2">
                  <UBadge :color="group.color as any" variant="soft" :icon="group.icon" size="xs">{{ group.label }}</UBadge>
                  <span class="text-[10px] text-muted tabular-nums">{{ group.entities.length }}</span>
                </div>
              </div>
              <div class="divide-y divide-default">
                <div v-for="entity in group.entities.slice(0, 4)" :key="entity.id" class="flex items-center justify-between px-3 py-1.5">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-xs font-medium truncate">{{ entity.name }}</span>
                    <UBadge v-if="entity.world" color="primary" variant="subtle" size="xs">{{ entity.world.name }}</UBadge>
                  </div>
                  <div class="flex items-center gap-1">
                    <UAvatar :src="avatarUrl(entity.updated_by)" :alt="entity.updated_by" size="3xs" />
                    <span class="text-[10px] text-muted tabular-nums">{{ relativeTime(entity.modified_at) }}</span>
                  </div>
                </div>
                <div v-if="group.entities.length > 4" class="px-3 py-1.5 text-[10px] text-muted text-center">
                  +{{ group.entities.length - 4 }} more
                </div>
              </div>
            </div>
          </div>

          <!-- Recent transitions + Top blocked (4/12) -->
          <div class="lg:col-span-4 space-y-4">
            <h2 class="text-sm font-semibold">Recent Transitions</h2>
            <div class="rounded-lg border border-default divide-y divide-default">
              <div v-for="t in recentTransitions" :key="t.entity.id" class="flex items-center gap-2 px-3 py-2">
                <UAvatar :src="avatarUrl(t.by)" :alt="t.by" size="2xs" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1">
                    <span class="text-xs font-medium truncate">{{ t.entity.name }}</span>
                    <UIcon name="i-lucide-arrow-right" class="text-[10px] text-muted shrink-0" />
                    <UBadge :color="editorialStatusMeta(t.status).color" :variant="editorialStatusMeta(t.status).variant" size="xs">{{ editorialStatusMeta(t.status).label }}</UBadge>
                  </div>
                  <span class="text-[10px] text-muted">{{ t.by }} · {{ relativeTime(t.at) }}</span>
                </div>
              </div>
              <div v-if="!recentTransitions.length" class="px-3 py-4 text-center text-xs text-muted">No recent transitions</div>
            </div>

            <h2 class="text-sm font-semibold">Top Blocked</h2>
            <div v-if="topBlocked.length" class="rounded-lg border border-default divide-y divide-default">
              <div v-for="entity in topBlocked" :key="entity.id" class="px-3 py-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium truncate">{{ entity.name }}</span>
                  <UBadge color="error" variant="soft" size="xs">{{ entity.editorial!.blockingReasons.length }} blockers</UBadge>
                </div>
                <ul class="mt-1 text-[10px] text-muted list-disc list-inside">
                  <li v-for="r in entity.editorial!.blockingReasons.slice(0, 2)" :key="r">{{ r }}</li>
                  <li v-if="entity.editorial!.blockingReasons.length > 2">+{{ entity.editorial!.blockingReasons.length - 2 }} more</li>
                </ul>
              </div>
            </div>
            <div v-else class="rounded-lg border border-dashed border-default p-4 text-center text-xs text-muted">No blocked entities</div>
          </div>

          <!-- Translation summary (3/12) -->
          <div class="lg:col-span-3 space-y-4">
            <h2 class="text-sm font-semibold">Translation Coverage</h2>
            <div class="space-y-3">
              <div v-for="summary in entityTypeSummary" :key="summary.type" class="rounded-lg border border-default p-3">
                <div class="flex items-center justify-between mb-2">
                  <UBadge color="neutral" variant="outline" size="xs">{{ summary.type }}</UBadge>
                  <span class="text-xs font-medium tabular-nums" :class="summary.percentage === 100 ? 'text-success' : 'text-warning'">{{ summary.percentage }}%</span>
                </div>
                <div class="w-full h-1.5 rounded-full bg-muted/30 overflow-hidden mb-2">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="summary.percentage === 100 ? 'bg-success' : summary.percentage > 50 ? 'bg-warning' : 'bg-error'"
                    :style="{ width: `${summary.percentage}%` }"
                    role="progressbar"
                    :aria-valuenow="summary.percentage"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
                <div class="flex justify-between text-[10px] text-muted">
                  <span>{{ summary.fullyTranslated }}/{{ summary.total }}</span>
                  <span v-if="summary.missingLangs.length">{{ summary.missingLangs.join(', ') }}</span>
                </div>
              </div>
            </div>

            <!-- API call comparison -->
            <div class="rounded-lg border border-default p-3 bg-muted/10">
              <p class="text-xs font-medium mb-2">API Calls</p>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between"><span class="text-muted">Current</span><span class="font-mono text-error">12+</span></div>
                <div class="flex justify-between"><span class="text-muted">This approach</span><span class="font-mono text-success">6</span></div>
                <div class="flex justify-between"><span class="text-muted">Aggregation</span><span class="font-mono text-success">1</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Integration notes -->
    <div class="mt-6 max-w-7xl mx-auto px-4 pb-6">
      <div class="p-4 rounded-lg bg-muted/30 border border-default">
        <p class="text-xs text-muted leading-relaxed">
          <strong>Integration:</strong> Replace <code class="text-xs">useEditorialDashboard</code>'s
          N&times;M fetch pattern. Use list calls (1 per entity type).
          Quick actions link to Create Flow, Board, and Studio sketches.
          World filter applies globally. Top blocked and recent transitions drive editorial priority.
        </p>
      </div>
    </div>
  </div>
</template>
