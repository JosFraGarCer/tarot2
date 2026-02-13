<!--
  /pages/sketches/card-views.vue
  POC 11: Multiple view modes for the same entity

  OBJECTIVE:
  Prototype 4 distinct presentation modes for a card entity:
  1. Tarot Mode — full card aesthetic with decorative frame
  2. Lore Mode — large readable typography, story emphasis
  3. Technical Mode — dense metadata table
  4. Collection Grid Mode — thumbnails with filters

  SUCCESS CRITERIA:
  - Same mock entity data rendered in 4 visually distinct ways
  - Clear separation between presentation layer and data
  - Smooth switching between modes via segmented control
  - Each mode serves a different user intent
  - Accessible and keyboard-navigable

  INTEGRATION INTO /manage:
  1. View mode selector added to EntitySlideover or Studio editor header
  2. Tarot Mode → default for base_card, world_card
  3. Lore Mode → default for facet, arcana (text-heavy entities)
  4. Technical Mode → default for skill, card_type (metadata-heavy)
  5. Collection Grid → replaces current table view for visual browsing
  6. Mode preference stored per-user in localStorage or user settings
  7. Extensible to other entities: each entity type defines which modes are available
     via useEntityCapabilities (e.g. capabilities.viewModes: ['tarot', 'technical'])
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  generateMockEntities,
  editorialStatusMeta,
  translationCoverage,
  type MockEntity,
} from '~/components/sketches/mockData'
import EntityEditorialIndicator from '~/components/sketches/EntityEditorialIndicator.vue'

definePageMeta({ layout: 'default' })

const toast = useToast()

// --- Mock data ---
const allEntities = generateMockEntities(12)
const entity = ref<MockEntity>({ ...allEntities[0] })

const coverage = computed(() => {
  const cov = translationCoverage(entity.value.translations)
  return { current: cov.done, total: cov.total }
})

// --- View modes ---
type ViewMode = 'tarot' | 'lore' | 'technical' | 'collection'
const activeMode = ref<ViewMode>('tarot')

const viewModes: { value: ViewMode; label: string; icon: string; description: string }[] = [
  { value: 'tarot', label: 'Tarot', icon: 'i-lucide-sparkles', description: 'Full card aesthetic' },
  { value: 'lore', label: 'Lore', icon: 'i-lucide-book-open', description: 'Story & text focus' },
  { value: 'technical', label: 'Technical', icon: 'i-lucide-table', description: 'Dense metadata' },
  { value: 'collection', label: 'Collection', icon: 'i-lucide-grid-3x3', description: 'Visual grid' },
]

// --- Mock lore content ---
const loreContent = {
  story: `The Fool stands at the edge of a cliff, gazing upward at the sky with a small white dog at their feet. They carry a small bundle on a stick, representing untapped potential and the beginning of a journey into the unknown.\n\nIn the Tarot tradition, The Fool is numbered 0 — the only card without a fixed position in the Major Arcana sequence. This reflects their nature as both the beginning and the end, the alpha and omega of the spiritual journey.\n\nThe white rose in The Fool's left hand symbolizes purity and innocence, while the mountains behind represent the challenges that lie ahead. The bright sun overhead suggests divine protection and the warmth of new beginnings.`,
  version_history: [
    { version: 3, date: '2026-02-10', author: 'alice', note: 'Expanded symbolism section' },
    { version: 2, date: '2026-02-05', author: 'bob', note: 'Added mountain imagery description' },
    { version: 1, date: '2026-01-20', author: 'carol', note: 'Initial lore draft' },
  ],
  related_entities: [
    { name: 'The World', type: 'base_card', relation: 'Completes the journey' },
    { name: 'Ethereal Realm', type: 'world', relation: 'Primary world' },
    { name: 'Innocence', type: 'facet', relation: 'Core facet' },
    { name: 'Journey', type: 'skill', relation: 'Associated skill' },
  ],
}

// --- Collection filters ---
const collectionWorldFilter = ref<string>('')
const collectionArcanaFilter = ref<string>('')
const collectionSortBy = ref<string>('name')

const worldOptions = [
  { label: 'All worlds', value: '' },
  { label: 'Ethereal Realm', value: 'ethereal' },
  { label: 'Shadow Domain', value: 'shadow' },
  { label: 'Crystal Spire', value: 'crystal' },
]

const arcanaOptions = [
  { label: 'All arcana', value: '' },
  { label: 'Major Arcana', value: 'major' },
  { label: 'Minor Arcana', value: 'minor' },
]

const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Status', value: 'status' },
  { label: 'Recent', value: 'recent' },
]

const collectionEntities = computed(() => {
  const result = [...allEntities]
  if (collectionSortBy.value === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
  if (collectionSortBy.value === 'recent') result.sort((a, b) => b.modified_at.localeCompare(a.modified_at))
  return result
})

function selectCollectionEntity(e: MockEntity) {
  entity.value = { ...e }
  activeMode.value = 'tarot'
  toast.add({ title: `Viewing: ${e.name}`, color: 'neutral', icon: 'i-lucide-eye' })
}

// --- Technical metadata ---
const technicalRows = computed(() => [
  { key: 'ID', value: String(entity.value.id) },
  { key: 'Code', value: entity.value.code },
  { key: 'Entity Type', value: entity.value.entity_type },
  { key: 'Status', value: entity.value.status },
  { key: 'Editorial Status', value: entity.value.editorial_state?.status ?? 'N/A' },
  { key: 'Updated By', value: entity.value.editorial_state?.updated_by ?? 'N/A' },
  { key: 'Updated At', value: entity.value.editorial_state?.updated_at ? new Date(entity.value.editorial_state.updated_at).toLocaleString() : 'N/A' },
  { key: 'Created At', value: new Date(entity.value.created_at).toLocaleString() },
  { key: 'Modified At', value: new Date(entity.value.modified_at).toLocaleString() },
  { key: 'Active', value: entity.value.is_active ? 'Yes' : 'No' },
  { key: 'Publish Ready', value: entity.value.editorial?.publishReady ? 'Yes' : 'No' },
  { key: 'Tags', value: entity.value.tags.map(t => t.name).join(', ') || 'None' },
])

const translationMatrix = computed(() =>
  entity.value.translations.map(t => ({
    lang: t.lang.toUpperCase(),
    has_translation: t.has_translation,
    is_fallback: t.is_fallback,
    status: t.has_translation && !t.is_fallback ? 'Complete' : t.is_fallback ? 'Fallback' : 'Missing',
  })),
)
</script>

<template>
  <div class="min-h-screen bg-default flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-30 border-b border-default bg-default/95 backdrop-blur-sm">
      <div class="flex items-center justify-between px-4 py-3">
        <div class="flex items-center gap-3">
          <NuxtLink to="/sketches" class="text-muted hover:text-primary transition-colors" aria-label="Back to sketches">
            <UIcon name="i-lucide-arrow-left" />
          </NuxtLink>
          <h1 class="text-lg font-bold tracking-tight">Card Views</h1>
          <UBadge color="primary" variant="subtle" size="xs">Studio</UBadge>
        </div>

        <!-- View mode selector -->
        <div class="flex items-center rounded-md border border-default overflow-hidden">
          <button
            v-for="mode in viewModes"
            :key="mode.value"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
            :class="activeMode === mode.value ? 'bg-primary text-white' : 'text-muted hover:text-primary'"
            :aria-label="`${mode.label} view: ${mode.description}`"
            :aria-pressed="activeMode === mode.value"
            @click="activeMode = mode.value"
          >
            <UIcon :name="mode.icon" class="text-sm" />
            <span class="hidden sm:inline">{{ mode.label }}</span>
          </button>
        </div>

        <EntityEditorialIndicator
          :editorial-state="entity.editorial_state"
          :translation-coverage="coverage"
          compact
        />
      </div>
    </header>

    <main class="flex-1 overflow-y-auto">
      <!-- ===== TAROT MODE ===== -->
      <div v-if="activeMode === 'tarot'" class="flex items-start justify-center p-8">
        <div class="w-full max-w-sm">
          <!-- Decorative card frame -->
          <div class="relative rounded-2xl overflow-hidden shadow-2xl" style="aspect-ratio: 2 / 3.5;">
            <!-- Decorative border -->
            <div class="absolute inset-0 rounded-2xl border-4 border-amber-700/40 z-10 pointer-events-none" />
            <div class="absolute inset-1 rounded-xl border border-amber-600/20 z-10 pointer-events-none" />

            <!-- Background gradient -->
            <div class="absolute inset-0 bg-linear-to-b from-indigo-950 via-purple-950 to-slate-950" />

            <!-- Corner ornaments -->
            <div class="absolute top-3 left-3 text-amber-600/40 z-10">
              <UIcon name="i-lucide-sparkles" class="text-lg" />
            </div>
            <div class="absolute top-3 right-3 text-amber-600/40 z-10">
              <UIcon name="i-lucide-sparkles" class="text-lg" />
            </div>
            <div class="absolute bottom-3 left-3 text-amber-600/40 z-10">
              <UIcon name="i-lucide-sparkles" class="text-lg" />
            </div>
            <div class="absolute bottom-3 right-3 text-amber-600/40 z-10">
              <UIcon name="i-lucide-sparkles" class="text-lg" />
            </div>

            <!-- Title (top) -->
            <div class="relative z-10 pt-6 px-6 text-center">
              <h2 class="text-xl font-bold text-amber-100 tracking-wider uppercase">
                {{ entity.name }}
              </h2>
              <p class="text-xs text-amber-300/60 mt-1 tracking-widest">Major Arcana · 0</p>
            </div>

            <!-- Image area -->
            <div class="relative z-10 mx-6 mt-4 rounded-lg overflow-hidden border border-amber-700/30" style="aspect-ratio: 3 / 4;">
              <img
                :src="`https://picsum.photos/seed/${entity.code}/300/400`"
                :alt="`${entity.name} card art`"
                class="w-full h-full object-cover"
              >
              <!-- Status overlay -->
              <div class="absolute top-2 right-2">
                <UBadge
                  :color="editorialStatusMeta(entity.status).color"
                  :variant="editorialStatusMeta(entity.status).variant"
                  size="xs"
                  class="shadow-lg"
                >
                  {{ editorialStatusMeta(entity.status).label }}
                </UBadge>
              </div>
            </div>

            <!-- Keywords (bottom) -->
            <div class="relative z-10 px-6 pt-4 pb-6 text-center">
              <div class="flex flex-wrap justify-center gap-1.5">
                <span
                  v-for="tag in entity.tags"
                  :key="tag.id"
                  class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-900/40 text-amber-200/80 border border-amber-700/30"
                >
                  {{ tag.name }}
                </span>
              </div>
              <p class="text-[10px] text-amber-400/40 mt-3 tracking-widest uppercase">
                beginnings · faith · journey
              </p>
            </div>
          </div>

          <!-- Card info below -->
          <div class="mt-4 text-center">
            <p class="text-xs text-muted">
              #{{ entity.code }} · {{ entity.entity_type }} · Last edited by {{ entity.updated_by }}
            </p>
          </div>
        </div>
      </div>

      <!-- ===== LORE MODE ===== -->
      <div v-if="activeMode === 'lore'" class="max-w-2xl mx-auto p-8 space-y-8">
        <!-- Header -->
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <UBadge
              :color="editorialStatusMeta(entity.status).color"
              :variant="editorialStatusMeta(entity.status).variant"
              :icon="editorialStatusMeta(entity.status).icon"
              size="sm"
            >
              {{ editorialStatusMeta(entity.status).label }}
            </UBadge>
            <UBadge color="neutral" variant="outline" size="xs">{{ entity.entity_type }}</UBadge>
          </div>
          <h2 class="text-3xl font-bold tracking-tight">{{ entity.name }}</h2>
          <p class="text-lg text-muted">Major Arcana · Card 0</p>
        </div>

        <!-- Story text -->
        <article class="prose prose-sm prose-invert max-w-none">
          <p
            v-for="(paragraph, idx) in loreContent.story.split('\n\n')"
            :key="idx"
            class="text-base leading-relaxed text-muted first:text-lg first:leading-relaxed"
          >
            {{ paragraph }}
          </p>
        </article>

        <!-- Version history -->
        <div class="space-y-3">
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">Version History</h3>
          <div class="space-y-2">
            <div
              v-for="v in loreContent.version_history"
              :key="v.version"
              class="flex items-center gap-3 text-xs"
            >
              <UBadge color="neutral" variant="outline" size="xs">v{{ v.version }}</UBadge>
              <span class="text-muted">{{ v.date }}</span>
              <span class="font-medium">{{ v.author }}</span>
              <span class="text-muted">{{ v.note }}</span>
            </div>
          </div>
        </div>

        <!-- Related entities -->
        <div class="space-y-3">
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">Related Entities</h3>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="rel in loreContent.related_entities"
              :key="rel.name"
              class="flex items-center gap-3 p-3 rounded-lg border border-default hover:border-primary/40 transition-colors text-left"
              :aria-label="`Related: ${rel.name} (${rel.type})`"
              @click="toast.add({ title: `Navigate to ${rel.name}`, color: 'neutral', icon: 'i-lucide-external-link' })"
            >
              <UIcon name="i-lucide-link" class="text-muted shrink-0" />
              <div>
                <p class="text-sm font-medium">{{ rel.name }}</p>
                <p class="text-[10px] text-muted">{{ rel.type }} · {{ rel.relation }}</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- ===== TECHNICAL MODE ===== -->
      <div v-if="activeMode === 'technical'" class="max-w-3xl mx-auto p-6 space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold">{{ entity.name }} — Technical View</h2>
          <EntityEditorialIndicator
            :editorial-state="entity.editorial_state"
            :translation-coverage="coverage"
          />
        </div>

        <!-- Metadata table -->
        <div class="rounded-lg border border-default overflow-hidden">
          <table class="w-full text-sm" aria-label="Entity metadata">
            <thead>
              <tr class="bg-muted/10">
                <th class="text-left px-4 py-2 text-xs font-semibold text-muted w-40">Field</th>
                <th class="text-left px-4 py-2 text-xs font-semibold text-muted">Value</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="row in technicalRows" :key="row.key">
                <td class="px-4 py-2 text-xs text-muted font-medium">{{ row.key }}</td>
                <td class="px-4 py-2 text-xs font-mono">{{ row.value }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Translation matrix -->
        <div class="space-y-2">
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">Translation Matrix</h3>
          <div class="rounded-lg border border-default overflow-hidden">
            <table class="w-full text-sm" aria-label="Translation status matrix">
              <thead>
                <tr class="bg-muted/10">
                  <th class="text-left px-4 py-2 text-xs font-semibold text-muted">Lang</th>
                  <th class="text-left px-4 py-2 text-xs font-semibold text-muted">Has Translation</th>
                  <th class="text-left px-4 py-2 text-xs font-semibold text-muted">Is Fallback</th>
                  <th class="text-left px-4 py-2 text-xs font-semibold text-muted">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr v-for="t in translationMatrix" :key="t.lang">
                  <td class="px-4 py-2 text-xs font-mono font-bold">{{ t.lang }}</td>
                  <td class="px-4 py-2">
                    <UIcon
                      :name="t.has_translation ? 'i-lucide-check' : 'i-lucide-x'"
                      :class="t.has_translation ? 'text-success' : 'text-error'"
                    />
                  </td>
                  <td class="px-4 py-2">
                    <UIcon
                      :name="t.is_fallback ? 'i-lucide-check' : 'i-lucide-x'"
                      :class="t.is_fallback ? 'text-warning' : 'text-muted'"
                    />
                  </td>
                  <td class="px-4 py-2">
                    <UBadge
                      :color="t.status === 'Complete' ? 'success' : t.status === 'Fallback' ? 'warning' : 'error'"
                      variant="soft"
                      size="xs"
                    >
                      {{ t.status }}
                    </UBadge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Blocking reasons -->
        <div v-if="entity.editorial?.blockingReasons.length" class="space-y-2">
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">Blocking Reasons</h3>
          <div class="space-y-1">
            <div
              v-for="(reason, idx) in entity.editorial.blockingReasons"
              :key="idx"
              class="flex items-center gap-2 text-xs text-warning"
            >
              <UIcon name="i-lucide-alert-triangle" class="shrink-0" />
              {{ reason }}
            </div>
          </div>
        </div>

        <!-- Allowed transitions -->
        <div v-if="entity.editorial?.allowedTransitions.length" class="space-y-2">
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">Allowed Transitions</h3>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="t in entity.editorial.allowedTransitions"
              :key="t"
              :color="editorialStatusMeta(t).color"
              :variant="editorialStatusMeta(t).variant"
              :icon="editorialStatusMeta(t).icon"
              size="xs"
            >
              {{ editorialStatusMeta(t).label }}
            </UBadge>
          </div>
        </div>
      </div>

      <!-- ===== COLLECTION GRID MODE ===== -->
      <div v-if="activeMode === 'collection'" class="p-6 space-y-6">
        <!-- Filters -->
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <USelect
              v-model="collectionWorldFilter"
              :items="worldOptions"
              size="xs"
              class="w-36"
              aria-label="Filter by world"
            />
            <USelect
              v-model="collectionArcanaFilter"
              :items="arcanaOptions"
              size="xs"
              class="w-36"
              aria-label="Filter by arcana"
            />
            <USelect
              v-model="collectionSortBy"
              :items="sortOptions"
              size="xs"
              class="w-28"
              aria-label="Sort by"
            />
          </div>
          <span class="text-xs text-muted">{{ collectionEntities.length }} cards</span>
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <button
            v-for="e in collectionEntities"
            :key="e.id"
            class="group rounded-xl border border-default overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all text-left"
            :class="{ 'ring-2 ring-primary': entity.id === e.id }"
            :aria-label="`View ${e.name}`"
            @click="selectCollectionEntity(e)"
          >
            <!-- Thumbnail -->
            <div class="relative" style="aspect-ratio: 2 / 3;">
              <img
                :src="`https://picsum.photos/seed/${e.code}${e.id}/200/300`"
                :alt="`${e.name} thumbnail`"
                class="w-full h-full object-cover"
                loading="lazy"
              >
              <!-- Status overlay -->
              <div class="absolute top-1.5 right-1.5">
                <UBadge
                  :color="editorialStatusMeta(e.status).color"
                  :variant="editorialStatusMeta(e.status).variant"
                  size="xs"
                  class="shadow-sm"
                >
                  {{ editorialStatusMeta(e.status).label }}
                </UBadge>
              </div>
              <!-- Translation coverage -->
              <div class="absolute bottom-1.5 left-1.5">
                <UBadge
                  :color="translationCoverage(e.translations).done === translationCoverage(e.translations).total ? 'success' : 'warning'"
                  variant="soft"
                  size="xs"
                  class="shadow-sm"
                >
                  {{ translationCoverage(e.translations).label }}
                </UBadge>
              </div>
            </div>

            <!-- Info -->
            <div class="p-2">
              <p class="text-xs font-medium truncate group-hover:text-primary transition-colors">{{ e.name }}</p>
              <p class="text-[10px] text-muted">{{ e.entity_type }}</p>
            </div>
          </button>
        </div>
      </div>
    </main>

    <!-- Integration notes -->
    <div class="border-t border-default p-4 bg-muted/10">
      <p class="text-xs text-muted text-center max-w-3xl mx-auto leading-relaxed">
        <strong>Integration:</strong> Add view mode selector to <code class="text-xs">EntitySlideover</code> or Studio header.
        Default mode per entity type via <code class="text-xs">useEntityCapabilities.viewModes</code>.
        Tarot/Lore for visual entities, Technical for metadata-heavy.
        Collection Grid replaces table view. Mode preference stored in <code class="text-xs">localStorage</code>.
        Extensible to any entity by defining available modes in capabilities.
      </p>
    </div>
  </div>
</template>
