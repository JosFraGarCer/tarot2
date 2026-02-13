<!--
  /pages/sketches/editorial-indicator.vue
  POC 3: EntityEditorialIndicator — reusable editorial health component

  OBJECTIVE:
  Demo the EntityEditorialIndicator component with its clean prop API:
  - editorial_state (nullable) — from API LIST/DETAIL
  - translation_coverage { current, total } — computed client-side
  - next_action? string — from editorial.allowedTransitions[0]

  Render: [draft ●] [2/3 langs] [→ review]
  Degradation: editorial_state=null → "Not initialized" badge, layout intact.

  SUCCESS CRITERIA:
  - Renders correctly with editorial_state: null
  - Full aria-label on root describes all three dimensions
  - Works in table cell (compact), slideover header (full), dashboard card

  INTEGRATION INTO /manage:
  1. Promote to /components/common/EntityEditorialIndicator.vue
  2. Use in ManageTableBridge cell slot for editorial column
  3. Use in EntityCards header area
  4. Use in EntitySlideover header next to title
  5. Use in dashboard.vue items
  6. Compute translation_coverage from entity.translations or translation_state
  7. Compute next_action from editorial.allowedTransitions[0] via editorialStatusMeta
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  generateMockEntities,
  translationCoverage,
  EDITORIAL_TRANSITIONS,
  editorialStatusMeta,
} from '~/components/sketches/mockData'
import EntityEditorialIndicator from '~/components/sketches/EntityEditorialIndicator.vue'

definePageMeta({ layout: 'default' })

const isAuthenticated = ref(true)
const allEntities = ref(generateMockEntities(10))

// Transform mock entities into the clean prop shape for EntityEditorialIndicator
function toCoverage(entity: (typeof allEntities.value)[0]) {
  const cov = translationCoverage(entity.translations)
  return { current: cov.done, total: cov.total }
}

function toNextAction(entity: (typeof allEntities.value)[0]): string | null {
  if (!entity.editorial_state) return null
  const transitions = entity.editorial?.allowedTransitions ?? EDITORIAL_TRANSITIONS[entity.editorial_state.status] ?? []
  if (!transitions.length) return null
  return editorialStatusMeta(transitions[0]).label
}

const demoRows = computed(() =>
  allEntities.value.map(e => ({
    id: e.id,
    name: e.name,
    code: e.code,
    entityType: e.entity_type,
    editorialState: e.editorial_state,
    coverage: toCoverage(e),
    nextAction: toNextAction(e),
  }))
)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
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
            EntityEditorialIndicator
          </h1>
          <UBadge color="warning" variant="subtle" size="xs">
            P1
          </UBadge>
        </div>
        <p class="text-xs text-muted mt-1 ml-6">
          Clean prop API: <code class="text-[10px]">editorial_state</code> +
          <code class="text-[10px]">translation_coverage {current, total}</code> +
          <code class="text-[10px]">next_action?</code>
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
        Editorial indicators require authentication.
      </p>
      <UButton label="Simulate Login" icon="i-lucide-log-in" @click="isAuthenticated = true" />
    </div>

    <template v-else>
      <!-- Context 1: Full mode (slideover / detail) -->
      <section class="mb-8">
        <h2 class="text-sm font-semibold mb-3">
          Full Mode (Slideover / Detail)
        </h2>
        <div class="space-y-3">
          <div
            v-for="row in demoRows"
            :key="row.id"
            class="flex items-center justify-between p-3 rounded-lg border border-default"
          >
            <div class="flex flex-col gap-0.5">
              <span class="text-sm font-medium">{{ row.name }}</span>
              <span class="text-xs text-muted">#{{ row.code }}</span>
            </div>
            <EntityEditorialIndicator
              :editorial-state="row.editorialState"
              :translation-coverage="row.coverage"
              :next-action="row.nextAction"
            />
          </div>

          <!-- Null state demo -->
          <div class="flex items-center justify-between p-3 rounded-lg border border-dashed border-default">
            <div class="flex flex-col gap-0.5">
              <span class="text-sm font-medium">Entity Without State</span>
              <span class="text-xs text-muted">#no_state</span>
            </div>
            <EntityEditorialIndicator
              :editorial-state="null"
              :translation-coverage="{ current: 1, total: 3 }"
            />
          </div>

          <!-- Null coverage demo -->
          <div class="flex items-center justify-between p-3 rounded-lg border border-dashed border-default">
            <div class="flex flex-col gap-0.5">
              <span class="text-sm font-medium">Entity Without Translations</span>
              <span class="text-xs text-muted">#no_translations</span>
            </div>
            <EntityEditorialIndicator
              :editorial-state="{ status: 'draft', updated_by: null, updated_at: null }"
            />
          </div>
        </div>
      </section>

      <!-- Context 2: Compact mode (table cells, card badges) -->
      <section class="mb-8">
        <h2 class="text-sm font-semibold mb-3">
          Compact Mode (Table Cell / Card Badge)
        </h2>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="row in demoRows"
            :key="row.id"
            class="flex items-center gap-2 p-2 rounded border border-default"
          >
            <span class="text-xs font-medium truncate max-w-24">{{ row.name }}</span>
            <EntityEditorialIndicator
              :editorial-state="row.editorialState"
              :translation-coverage="row.coverage"
              compact
            />
          </div>
        </div>
      </section>

      <!-- Context 3: Dashboard summary cards -->
      <section class="mb-8">
        <h2 class="text-sm font-semibold mb-3">
          Dashboard Card Context
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="row in demoRows.slice(0, 4)"
            :key="row.id"
            class="p-4 rounded-lg border border-default"
          >
            <div class="flex items-start justify-between mb-2">
              <div>
                <h3 class="text-sm font-semibold">
                  {{ row.name }}
                </h3>
                <p class="text-xs text-muted">
                  {{ row.entityType }} &middot; #{{ row.code }}
                </p>
              </div>
              <UBadge color="neutral" variant="outline" size="xs">
                {{ row.entityType }}
              </UBadge>
            </div>
            <EntityEditorialIndicator
              :editorial-state="row.editorialState"
              :translation-coverage="row.coverage"
              :next-action="row.nextAction"
            />
          </div>
        </div>
      </section>

      <!-- Prop API reference -->
      <section class="mb-8">
        <h2 class="text-sm font-semibold mb-3">
          Prop API
        </h2>
        <div class="rounded-lg border border-default overflow-hidden">
          <table class="w-full text-xs">
            <thead class="bg-muted/30">
              <tr>
                <th class="text-left px-3 py-2 font-medium">Prop</th>
                <th class="text-left px-3 py-2 font-medium">Type</th>
                <th class="text-left px-3 py-2 font-medium">Required</th>
                <th class="text-left px-3 py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr>
                <td class="px-3 py-2 font-mono">editorial-state</td>
                <td class="px-3 py-2 text-muted">{ status, updated_by?, updated_at? } | null</td>
                <td class="px-3 py-2">Yes</td>
                <td class="px-3 py-2 text-muted">From API LIST/DETAIL editorial_state field</td>
              </tr>
              <tr>
                <td class="px-3 py-2 font-mono">translation-coverage</td>
                <td class="px-3 py-2 text-muted">{ current: number, total: number } | null</td>
                <td class="px-3 py-2">No</td>
                <td class="px-3 py-2 text-muted">Computed from translations array or translation_state</td>
              </tr>
              <tr>
                <td class="px-3 py-2 font-mono">next-action</td>
                <td class="px-3 py-2 text-muted">string | null</td>
                <td class="px-3 py-2">No</td>
                <td class="px-3 py-2 text-muted">Label of next editorial transition (from allowedTransitions[0])</td>
              </tr>
              <tr>
                <td class="px-3 py-2 font-mono">compact</td>
                <td class="px-3 py-2 text-muted">boolean</td>
                <td class="px-3 py-2">No</td>
                <td class="px-3 py-2 text-muted">Icon-only status badge, hides next-action hint</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Integration notes -->
      <div class="p-4 rounded-lg bg-muted/30 border border-default">
        <p class="text-xs text-muted leading-relaxed">
          <strong>Integration:</strong> Promote
          <code class="text-xs">EntityEditorialIndicator</code> to
          <code class="text-xs">components/common/</code>.
          Compute <code class="text-xs">translation_coverage</code> from
          <code class="text-xs">entity.translations</code> or
          <code class="text-xs">translation_state</code>.
          Compute <code class="text-xs">next_action</code> from
          <code class="text-xs">editorial.allowedTransitions[0]</code> (detail) or
          <code class="text-xs">EDITORIAL_TRANSITIONS</code> map (list).
        </p>
      </div>
    </template>
  </div>
</template>
