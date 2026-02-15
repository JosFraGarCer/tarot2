<!--
  /pages/sketches/codex-grimoire.vue
  POC: Codex / Grimoire View — immersive encyclopedia-style browse

  OBJECTIVE:
  A fantasy-themed, book-like browsing experience for all entities.
  Two modes: Codex (structured index) and Grimoire (immersive card-by-card reading).
  Designed for "lore enthusiasts" who want to explore the tarot world.

  SUCCESS CRITERIA:
  - Book-like pagination feel (prev/next navigation)
  - Rich card display with image, lore text, metadata
  - Filter by arcana, entity type, status
  - Keyboard navigation (arrow keys)
  - Dark fantasy aesthetic

  INTEGRATION INTO /manage:
  1. New route: /manage/codex or public /codex
  2. Entities from useEntity list endpoint
  3. Images from entity.image field
  4. Lore text from entity translations (description field)
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  generateMockEntities,
  editorialStatusMeta,
  releaseStageDot,
  releaseStageLabel,
  translationStatusDot,
  avatarUrl,
  relativeTime,
  type MockEntity,
} from '~/components/sketches/mockData'

definePageMeta({ layout: 'default' })

// --- Data ---
const allEntities = ref(generateMockEntities(10))

// --- View mode ---
type ViewMode = 'codex' | 'grimoire'
const viewMode = ref<ViewMode>('codex')

// --- Filters ---
const entityTypeFilter = ref('')
const entityTypes = computed(() => {
  const types = new Set(allEntities.value.map(e => e.entity_type))
  return [{ label: 'All types', value: '' }, ...Array.from(types).map(t => ({ label: t, value: t }))]
})

const filteredEntities = computed(() => {
  if (!entityTypeFilter.value) return allEntities.value
  return allEntities.value.filter(e => e.entity_type === entityTypeFilter.value)
})

// --- Grimoire pagination ---
const currentIndex = ref(0)
const currentEntity = computed(() => filteredEntities.value[currentIndex.value] ?? filteredEntities.value[0])

function goNext() {
  if (currentIndex.value < filteredEntities.value.length - 1) currentIndex.value++
}
function goPrev() {
  if (currentIndex.value > 0) currentIndex.value--
}
function goTo(idx: number) {
  currentIndex.value = Math.max(0, Math.min(idx, filteredEntities.value.length - 1))
}

// --- Keyboard navigation ---
function onKeyDown(e: KeyboardEvent) {
  if (viewMode.value !== 'grimoire') return
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext() }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev() }
}

// --- Mock lore data per entity ---
const loreTexts: Record<string, string> = {
  fool: 'The Fool stands at the edge of a cliff, gazing upward at the sky. A small dog barks at their heels. The number 0 marks the beginning and the end — the eternal cycle of the journey. In the Ethereal Realm, The Fool is known as the Wanderer of Beginnings, carrying nothing but faith and the wind at their back.',
  magician: 'With one hand raised to the heavens and the other pointing to the earth, The Magician channels the raw power of creation. The four suits of the tarot lay before them on the table — cups, pentacles, swords, and wands — representing mastery over all elements.',
  high_priestess: 'She sits between two pillars — one black, one white — guarding the threshold of the unconscious mind. The scroll in her lap contains the secrets of the universe, partially hidden by her cloak. Only those who approach with genuine seeking may read its words.',
  empress: 'Surrounded by golden wheat and flowing water, The Empress embodies abundance and nurturing creation. Her crown of twelve stars connects her to the celestial cycles. She is the mother of all living things in the tarot cosmos.',
  emperor: 'Upon a throne of stone carved with ram heads, The Emperor surveys his domain with unwavering authority. His red robes speak of passion tempered by discipline. The orb and scepter in his hands represent worldly power and spiritual dominion.',
  hierophant: 'The Hierophant sits between two acolytes, one hand raised in blessing. He is the bridge between the divine and the mortal, the keeper of sacred traditions. His triple crown represents mastery of the three worlds.',
  lovers: 'Two figures stand beneath the angel Raphael, whose wings spread across the sky. The choice before them is not merely romantic — it is the fundamental decision between the conscious and unconscious paths.',
  chariot: 'A warrior rides forth in a chariot pulled by two sphinxes — one black, one white. Through sheer willpower, opposing forces are harnessed toward a single destination. Victory belongs to those who master their inner contradictions.',
  strength: 'A woman gently closes the jaws of a lion, not through force but through infinite patience and compassion. The infinity symbol above her head marks her connection to the eternal. True strength is the courage to be gentle.',
  hermit: 'Atop a snow-covered mountain, The Hermit holds a lantern containing a six-pointed star. He has withdrawn from the world not in defeat but in pursuit of deeper truth. The staff in his other hand represents the authority of hard-won wisdom.',
}

function getLore(entity: MockEntity): string {
  return loreTexts[entity.code] ?? `The mysteries of ${entity.name} remain to be written. This entity awaits its lore in the great codex of the tarot world.`
}

function getImageUrl(entity: MockEntity): string {
  return entity.image ?? `https://picsum.photos/seed/${entity.code}${entity.id}/400/600`
}
</script>

<template>
  <div
    class="min-h-screen bg-default flex flex-col"
    tabindex="0"
    @keydown="onKeyDown"
  >
    <!-- Header -->
    <header class="sticky top-0 z-30 border-b border-default bg-default/95 backdrop-blur-sm">
      <div class="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
        <div class="flex items-center gap-3">
          <NuxtLink to="/sketches" class="text-muted hover:text-primary transition-colors" aria-label="Back to sketches">
            <UIcon name="i-lucide-arrow-left" />
          </NuxtLink>
          <h1 class="text-lg font-bold tracking-tight">Codex / Grimoire</h1>
          <UBadge color="primary" variant="subtle" size="xs">Phase 3</UBadge>
        </div>

        <div class="flex items-center gap-3">
          <!-- View mode toggle -->
          <div class="flex items-center rounded-md border border-default overflow-hidden">
            <button
              class="px-3 py-1.5 text-xs font-medium transition-colors"
              :class="viewMode === 'codex' ? 'bg-primary text-white' : 'text-muted hover:text-primary'"
              @click="viewMode = 'codex'"
            >
              <UIcon name="i-lucide-book-open" class="mr-1" />
              Codex
            </button>
            <button
              class="px-3 py-1.5 text-xs font-medium transition-colors"
              :class="viewMode === 'grimoire' ? 'bg-primary text-white' : 'text-muted hover:text-primary'"
              @click="viewMode = 'grimoire'"
            >
              <UIcon name="i-lucide-scroll-text" class="mr-1" />
              Grimoire
            </button>
          </div>

          <USelect
            :model-value="entityTypeFilter"
            :items="entityTypes"
            size="xs"
            class="w-36"
            aria-label="Filter by entity type"
            @update:model-value="entityTypeFilter = $event"
          />

          <UBadge color="neutral" variant="outline" size="xs">
            {{ filteredEntities.length }} entries
          </UBadge>
        </div>
      </div>
    </header>

    <!-- ===== CODEX MODE ===== -->
    <main v-if="viewMode === 'codex'" class="flex-1 p-6 max-w-6xl mx-auto w-full">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="(entity, idx) in filteredEntities"
          :key="entity.id"
          class="group rounded-xl border border-default overflow-hidden hover:border-primary/40 transition-all hover:shadow-lg cursor-pointer"
          role="button"
          :aria-label="`Open ${entity.name} in Grimoire`"
          tabindex="0"
          @click="currentIndex = idx; viewMode = 'grimoire'"
          @keydown.enter="currentIndex = idx; viewMode = 'grimoire'"
        >
          <div class="flex gap-4 p-4">
            <!-- Thumbnail -->
            <div class="w-24 shrink-0" style="aspect-ratio: 2 / 3;">
              <img
                :src="getImageUrl(entity)"
                :alt="`${entity.name} card art`"
                class="w-full h-full object-cover rounded-lg"
                loading="lazy"
              >
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0 space-y-2">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-sm font-bold group-hover:text-primary transition-colors">{{ entity.name }}</h2>
                <UBadge
                  :color="editorialStatusMeta(entity.status).color"
                  :variant="editorialStatusMeta(entity.status).variant"
                  size="xs"
                >
                  {{ editorialStatusMeta(entity.status).label }}
                </UBadge>
              </div>

              <div class="flex items-center gap-2 flex-wrap">
                <UBadge color="neutral" variant="outline" size="xs">{{ entity.entity_type }}</UBadge>
                <template v-if="entity.version_semver">
                  <span class="text-[10px] text-muted tabular-nums">v{{ entity.version_semver }}</span>
                  <span :class="`inline-block w-1.5 h-1.5 rounded-full ${releaseStageDot(entity.release_stage)}`" :title="releaseStageLabel(entity.release_stage)" />
                </template>
              </div>

              <p class="text-xs text-muted leading-relaxed line-clamp-3">{{ getLore(entity) }}</p>

              <!-- Translation dots -->
              <div class="flex items-center gap-1">
                <span
                  v-for="t in entity.translations"
                  :key="t.lang"
                  class="flex items-center gap-0.5"
                  :title="`${t.lang.toUpperCase()}: ${translationStatusDot(t.status).label}`"
                >
                  <span :class="`inline-block w-1.5 h-1.5 rounded-full ${translationStatusDot(t.status).dot}`" />
                  <span class="text-[9px] text-muted">{{ t.lang.toUpperCase() }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!filteredEntities.length" class="text-center py-16">
        <UIcon name="i-lucide-book-x" class="text-4xl text-muted/30 mb-3" />
        <p class="text-sm text-muted">No entries match the current filter.</p>
      </div>
    </main>

    <!-- ===== GRIMOIRE MODE ===== -->
    <main v-else class="flex-1 flex items-center justify-center p-6 overflow-hidden">
      <div v-if="currentEntity" class="w-full max-w-4xl">
        <!-- Page indicator -->
        <div class="text-center mb-4">
          <span class="text-xs text-muted tabular-nums">{{ currentIndex + 1 }} / {{ filteredEntities.length }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <!-- Left: Card image (full tarot) -->
          <div class="relative rounded-2xl border-2 border-default overflow-hidden shadow-2xl mx-auto max-w-sm w-full">
            <div style="aspect-ratio: 2 / 3;">
              <img
                :src="getImageUrl(currentEntity)"
                :alt="`${currentEntity.name} card art`"
                class="w-full h-full object-cover"
              >
            </div>
            <!-- Status overlay -->
            <div class="absolute top-3 left-3">
              <UBadge
                :color="editorialStatusMeta(currentEntity.status).color"
                :variant="editorialStatusMeta(currentEntity.status).variant"
                :icon="editorialStatusMeta(currentEntity.status).icon"
                size="sm"
                class="shadow-sm backdrop-blur-sm"
              >
                {{ editorialStatusMeta(currentEntity.status).label }}
              </UBadge>
            </div>
            <!-- Version overlay -->
            <div v-if="currentEntity.version_semver" class="absolute top-3 right-3">
              <UBadge color="neutral" variant="soft" size="xs" class="backdrop-blur-sm">
                v{{ currentEntity.version_semver }}
              </UBadge>
            </div>
          </div>

          <!-- Right: Lore text + metadata -->
          <div class="space-y-6">
            <div>
              <h2 class="text-2xl font-bold tracking-tight mb-1">{{ currentEntity.name }}</h2>
              <div class="flex items-center gap-2 flex-wrap">
                <UBadge color="neutral" variant="outline" size="xs">{{ currentEntity.entity_type }}</UBadge>
                <span class="text-xs text-muted">#{{ currentEntity.code }}</span>
                <template v-if="currentEntity.release_stage">
                  <span :class="`inline-block w-2 h-2 rounded-full ${releaseStageDot(currentEntity.release_stage)}`" />
                  <span class="text-xs text-muted">{{ releaseStageLabel(currentEntity.release_stage) }}</span>
                </template>
              </div>
            </div>

            <!-- Lore -->
            <div class="prose prose-sm prose-invert max-w-none">
              <p class="text-sm leading-relaxed text-default/80">{{ getLore(currentEntity) }}</p>
            </div>

            <!-- Tags -->
            <div v-if="currentEntity.tags.length" class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="tag in currentEntity.tags"
                :key="tag.id"
                color="neutral"
                variant="soft"
                size="xs"
              >
                {{ tag.name }}
              </UBadge>
            </div>

            <!-- Translation status -->
            <div class="rounded-lg border border-default p-3 space-y-2">
              <h3 class="text-xs font-semibold text-muted uppercase tracking-wider">Translations</h3>
              <div class="flex items-center gap-3">
                <span
                  v-for="t in currentEntity.translations"
                  :key="t.lang"
                  class="flex items-center gap-1"
                >
                  <span :class="`inline-block w-2 h-2 rounded-full ${translationStatusDot(t.status).dot}`" />
                  <span class="text-xs">{{ t.lang.toUpperCase() }}</span>
                  <span class="text-[10px] text-muted">{{ t.has_translation && !t.is_fallback ? translationStatusDot(t.status).label : 'missing' }}</span>
                </span>
              </div>
            </div>

            <!-- Blockers -->
            <div v-if="currentEntity.editorial?.blockingReasons.length" class="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-1">
              <h3 class="text-xs font-semibold text-warning uppercase tracking-wider">Blockers</h3>
              <div
                v-for="(reason, idx) in currentEntity.editorial!.blockingReasons"
                :key="idx"
                class="flex items-start gap-1.5 text-[10px] text-warning"
              >
                <UIcon name="i-lucide-alert-triangle" class="shrink-0 mt-0.5 text-[10px]" />
                <span>{{ reason }}</span>
              </div>
            </div>

            <!-- Metadata -->
            <div class="text-xs text-muted space-y-1">
              <div class="flex items-center gap-1.5">
                <UAvatar :src="avatarUrl(currentEntity.updated_by)" :alt="currentEntity.updated_by" size="2xs" />
                <span>{{ currentEntity.updated_by }} · {{ relativeTime(currentEntity.modified_at) }}</span>
              </div>
              <p v-if="currentEntity.content_version_id">Content version: #{{ currentEntity.content_version_id }}</p>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex items-center justify-between mt-8">
          <UButton
            :disabled="currentIndex === 0"
            label="Previous"
            icon="i-lucide-arrow-left"
            size="sm"
            variant="ghost"
            color="neutral"
            aria-label="Previous entry"
            @click="goPrev"
          />

          <!-- Page dots -->
          <div class="flex items-center gap-1">
            <button
              v-for="(_, idx) in filteredEntities"
              :key="idx"
              class="w-2 h-2 rounded-full transition-colors"
              :class="idx === currentIndex ? 'bg-primary' : 'bg-muted/30 hover:bg-muted/60'"
              :aria-label="`Go to entry ${idx + 1}`"
              @click="goTo(idx)"
            />
          </div>

          <UButton
            :disabled="currentIndex >= filteredEntities.length - 1"
            label="Next"
            trailing-icon="i-lucide-arrow-right"
            size="sm"
            variant="ghost"
            color="neutral"
            aria-label="Next entry"
            @click="goNext"
          />
        </div>
      </div>
    </main>

    <!-- Integration notes -->
    <div class="border-t border-default p-4 bg-muted/10">
      <p class="text-xs text-muted text-center max-w-3xl mx-auto leading-relaxed">
        <strong>Integration:</strong> Codex index from entity list endpoint. Grimoire detail from entity detail + translations.
        Images from <code class="text-xs">entity.image</code>. Lore from <code class="text-xs">description</code> field.
        Keyboard navigation: ← → arrows in Grimoire mode.
      </p>
    </div>
  </div>
</template>
