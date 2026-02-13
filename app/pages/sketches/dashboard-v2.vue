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
  type MockEntity,
  type EditorialStatus,
} from '~/components/sketches/mockData'
import EditorialIndicator from '~/components/sketches/EditorialIndicator.vue'

definePageMeta({ layout: 'default' })

const isAuthenticated = ref(true)

// Simulate fetching all entities in a single batch (1 call per entity type)
const allEntities = ref(generateMockEntities(10))

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

  for (const entity of allEntities.value) {
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

  for (const entity of allEntities.value) {
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
  const total = allEntities.value.length
  const needsAction = allEntities.value.filter(e =>
    ['draft', 'pending_review', 'rejected'].includes(e.editorial_state?.status ?? '')
  ).length
  const inReview = allEntities.value.filter(e =>
    ['review', 'translation_review'].includes(e.editorial_state?.status ?? '')
  ).length
  const published = allEntities.value.filter(e =>
    e.editorial_state?.status === 'published'
  ).length
  const missingTranslations = allEntities.value.filter(e => {
    const cov = translationCoverage(e.translations)
    return cov.done < cov.total
  }).length
  return { total, needsAction, inReview, published, missingTranslations }
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-2">
          <NuxtLink to="/sketches" class="text-muted hover:text-primary transition-colors" aria-label="Back to sketches">
            <UIcon name="i-lucide-arrow-left" />
          </NuxtLink>
          <h1 class="text-xl font-bold tracking-tight">
            Dashboard v2
          </h1>
          <UBadge color="warning" variant="subtle" size="xs">
            P1
          </UBadge>
        </div>
        <p class="text-xs text-muted mt-1 ml-6">
          Editorial dashboard using editorial_state from list endpoints. Single call per entity type.
        </p>
      </div>

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
        Dashboard requires authentication.
      </p>
      <UButton label="Simulate Login" icon="i-lucide-log-in" @click="isAuthenticated = true" />
    </div>

    <template v-else>
      <!-- Quick stats row -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div class="rounded-lg border border-default p-3">
          <div class="text-xs text-muted mb-1">
            Total Entities
          </div>
          <div class="text-xl font-bold tabular-nums">
            {{ stats.total }}
          </div>
        </div>
        <div class="rounded-lg border border-default p-3">
          <div class="text-xs text-muted mb-1">
            Needs Action
          </div>
          <div class="text-xl font-bold tabular-nums" :class="stats.needsAction > 0 ? 'text-warning' : ''">
            {{ stats.needsAction }}
          </div>
        </div>
        <div class="rounded-lg border border-default p-3">
          <div class="text-xs text-muted mb-1">
            In Review
          </div>
          <div class="text-xl font-bold tabular-nums">
            {{ stats.inReview }}
          </div>
        </div>
        <div class="rounded-lg border border-default p-3">
          <div class="text-xs text-muted mb-1">
            Published
          </div>
          <div class="text-xl font-bold tabular-nums text-success">
            {{ stats.published }}
          </div>
        </div>
        <div class="rounded-lg border border-default p-3">
          <div class="text-xs text-muted mb-1">
            Missing Translations
          </div>
          <div class="text-xl font-bold tabular-nums" :class="stats.missingTranslations > 0 ? 'text-error' : ''">
            {{ stats.missingTranslations }}
          </div>
        </div>
      </div>

      <!-- Two-column layout: Status groups + Translation summary -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Status groups (2/3 width) -->
        <div class="lg:col-span-2 space-y-4">
          <h2 class="text-sm font-semibold">
            By Editorial Status
          </h2>

          <div
            v-for="group in statusGroups"
            :key="group.status"
            class="rounded-lg border border-default"
          >
            <div class="flex items-center justify-between px-4 py-2.5 border-b border-default bg-muted/20">
              <div class="flex items-center gap-2">
                <UBadge
                  :color="group.color as any"
                  variant="soft"
                  :icon="group.icon"
                  size="xs"
                >
                  {{ group.label }}
                </UBadge>
                <span class="text-xs text-muted tabular-nums">
                  {{ group.entities.length }} {{ group.entities.length === 1 ? 'entity' : 'entities' }}
                </span>
              </div>
            </div>

            <div class="divide-y divide-default">
              <div
                v-for="entity in group.entities"
                :key="entity.id"
                class="flex items-center justify-between px-4 py-2"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="flex flex-col gap-0.5 min-w-0">
                    <span class="text-sm font-medium truncate">{{ entity.name }}</span>
                    <span class="text-[10px] text-muted">
                      {{ entity.entity_type }} &middot; #{{ entity.code }}
                    </span>
                  </div>
                </div>
                <EditorialIndicator
                  :editorial-state="entity.editorial_state"
                  :translations="entity.translations"
                  compact
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Translation summary (1/3 width) -->
        <div class="space-y-4">
          <h2 class="text-sm font-semibold">
            Translation Coverage by Type
          </h2>

          <div class="space-y-3">
            <div
              v-for="summary in entityTypeSummary"
              :key="summary.type"
              class="rounded-lg border border-default p-3"
            >
              <div class="flex items-center justify-between mb-2">
                <UBadge color="neutral" variant="outline" size="xs">
                  {{ summary.type }}
                </UBadge>
                <span class="text-xs font-medium tabular-nums" :class="summary.percentage === 100 ? 'text-success' : 'text-warning'">
                  {{ summary.percentage }}%
                </span>
              </div>

              <!-- Progress bar -->
              <div class="w-full h-1.5 rounded-full bg-muted/30 overflow-hidden mb-2">
                <div
                  class="h-full rounded-full transition-all"
                  :class="summary.percentage === 100 ? 'bg-success' : summary.percentage > 50 ? 'bg-warning' : 'bg-error'"
                  :style="{ width: `${summary.percentage}%` }"
                  role="progressbar"
                  :aria-valuenow="summary.percentage"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  :aria-label="`${summary.type}: ${summary.percentage}% translation coverage`"
                />
              </div>

              <div class="flex justify-between text-[10px] text-muted">
                <span>{{ summary.fullyTranslated }}/{{ summary.total }} fully translated</span>
                <span v-if="summary.missingLangs.length">
                  Missing: {{ summary.missingLangs.join(', ') }}
                </span>
              </div>
            </div>
          </div>

          <!-- API call comparison -->
          <div class="rounded-lg border border-default p-3 bg-muted/10">
            <p class="text-xs font-medium mb-2">
              API Call Comparison
            </p>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span class="text-muted">Current dashboard</span>
                <span class="font-mono text-error">12+ calls</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">This approach</span>
                <span class="font-mono text-success">6 calls</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">With aggregation endpoint</span>
                <span class="font-mono text-success">1 call</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Integration notes -->
    <div class="mt-6 p-4 rounded-lg bg-muted/30 border border-default">
      <p class="text-xs text-muted leading-relaxed">
        <strong>Integration:</strong> Replace <code class="text-xs">useEditorialDashboard</code>'s
        N&times;M fetch pattern. Use <code class="text-xs">useEntity.ts</code> list calls
        (1 per entity type) — <code class="text-xs">editorial_state</code> is already eager-loaded.
        Group client-side by <code class="text-xs">editorial_state.status</code>.
        Future: add a <code class="text-xs">/api/editorial/summary</code> aggregation endpoint
        for a single-call dashboard.
      </p>
    </div>
  </div>
</template>
