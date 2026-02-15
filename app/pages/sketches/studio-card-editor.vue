<!--
  /pages/sketches/studio-card-editor.vue
  POC 7: Visual-first "Studio" card editor

  OBJECTIVE:
  Replace the FormModal mental model with a visual card editor.
  Centered tarot-style card preview + right-side metadata panel.
  Top status bar with editorial indicator, language selector, quick transition.

  SUCCESS CRITERIA:
  - Visual-first: card preview dominates the viewport
  - All editorial state visible at a glance (status bar)
  - Language switching is instant (mock)
  - Transitions are 1-click from the status bar
  - Side panel organizes metadata, translations, editorial, feedback into tabs
  - Accessible: all interactive elements have aria-labels

  INTEGRATION INTO /manage:
  1. New route: /manage/:entity/:id/studio (or replace EntitySlideover for card-type entities)
  2. EntityEditorialIndicator in status bar from entity.editorial_state
  3. Language selector wired to useEntity lang switching
  4. Transitions call editorial API endpoints
  5. Side panel tabs replace EntitySlideover sections
  6. Image upload connects to useImageUpload composable
  7. Card preview connects to entity detail response fields
-->
<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  generateMockEntities,
  editorialStatusMeta,
  translationCoverage,
  translationStatusDot,
  releaseStageDot,
  releaseStageLabel,
  avatarUrl,
  relativeTime,
  EDITORIAL_TRANSITIONS,
  computeEditorial,
  type EditorialStatus,
  type MockEntity,
} from '~/components/sketches/mockData'
import EntityEditorialIndicator from '~/components/sketches/EntityEditorialIndicator.vue'
import SketchCrossNav from '~/components/sketches/SketchCrossNav.vue'

definePageMeta({ layout: 'default' })

const toast = useToast()

// --- Mock entity (the card being edited) ---
const allEntities = generateMockEntities(10)
const entity = ref<MockEntity>({ ...allEntities[0] })

// --- Language ---
const languages = ['en', 'fr', 'es'] as const
const currentLang = ref<string>('en')

// --- Editable card fields (per language mock) ---
const cardFields = reactive<Record<string, { title: string; subtitle: string; description: string; keywords: string }>>({
  en: { title: entity.value.name, subtitle: 'Major Arcana · 0', description: 'The Fool represents new beginnings, having faith in the future, being inexperienced, not knowing what to expect, having beginner\'s luck, improvisation and believing in the universe.', keywords: 'beginnings, faith, journey' },
  fr: { title: 'Le Mat', subtitle: 'Arcane Majeur · 0', description: 'Le Mat représente les nouveaux départs, la foi en l\'avenir, l\'inexpérience et la confiance dans l\'univers.', keywords: 'débuts, foi, voyage' },
  es: { title: 'El Loco', subtitle: 'Arcano Mayor · 0', description: 'El Loco representa nuevos comienzos, tener fe en el futuro, ser inexperto y creer en el universo.', keywords: 'comienzos, fe, viaje' },
})

const currentFields = computed(() => cardFields[currentLang.value] ?? cardFields.en)

// --- Image mock ---
const cardImageUrl = ref<string | null>(null)
const isUploadHover = ref(false)

function mockUploadImage() {
  cardImageUrl.value = `https://picsum.photos/seed/${Date.now()}/400/700`
  toast.add({ title: 'Image uploaded', description: 'Mock image assigned to card.', color: 'success', icon: 'i-lucide-image' })
}

function removeImage() {
  cardImageUrl.value = null
  toast.add({ title: 'Image removed', color: 'neutral', icon: 'i-lucide-image-off' })
}

// --- Editorial ---
const statusMeta = computed(() => editorialStatusMeta(entity.value.editorial_state?.status ?? null))
const coverage = computed(() => {
  const cov = translationCoverage(entity.value.translations)
  return { current: cov.done, total: cov.total }
})
const healthFlags = computed(() => ({
  hasImage: !!entity.value.image || !!cardImageUrl.value,
  hasEffects: entity.value.editorial?.blockingReasons.every(r => !r.includes('effects')) ?? true,
  dependencyHealth: mockDependencies.value.every(d => d.status === 'published' || d.status === 'approved') ? 'ok' as const : mockDependencies.value.some(d => d.status === 'draft' || d.status === 'rejected') ? 'blocked' as const : 'warning' as const,
}))
const nextTransitions = computed(() => {
  if (!entity.value.editorial_state) return []
  return EDITORIAL_TRANSITIONS[entity.value.editorial_state.status] ?? []
})
const primaryTransition = computed(() => nextTransitions.value[0] ?? null)

function canTransition(target: EditorialStatus): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = []
  if (target === 'published' && !entity.value.editorial?.publishReady) {
    if (!coverage.value || coverage.value.current < coverage.value.total) reasons.push('Missing translations')
    if (!healthFlags.value.hasImage) reasons.push('No image assigned')
    if (!healthFlags.value.hasEffects) reasons.push('No effects defined')
    if (healthFlags.value.dependencyHealth === 'blocked') reasons.push('Dependencies not ready')
    if (openFeedbackCount.value > 0) reasons.push(`${openFeedbackCount.value} unresolved feedback`)
  }
  if (target === 'pending_review' && openFeedbackCount.value > 0) {
    reasons.push(`${openFeedbackCount.value} unresolved feedback`)
  }
  return { allowed: reasons.length === 0, reasons }
}

function applyTransition(target: EditorialStatus) {
  const check = canTransition(target)
  if (!check.allowed) {
    toast.add({ title: 'Cannot transition', description: check.reasons.join('. '), color: 'warning', icon: 'i-lucide-alert-triangle' })
    return
  }
  entity.value = {
    ...entity.value,
    status: target,
    editorial_state: { ...entity.value.editorial_state!, status: target, updated_by: 'current_user', updated_at: new Date().toISOString() },
    editorial: computeEditorial(target, entity.value.translations, { hasImage: healthFlags.value.hasImage, hasEffects: healthFlags.value.hasEffects }),
  }
  const meta = editorialStatusMeta(target)
  toast.add({ title: `Transitioned to ${meta.label}`, color: 'success', icon: meta.icon })
}

const openFeedbackCount = computed(() => feedbackItems.value.filter(f => f.status === 'open').length)

// --- Publish readiness checklist ---
const readinessChecks = computed(() => [
  { label: 'Base content (EN)', ok: true, icon: 'i-lucide-file-text' },
  { label: 'All translations', ok: coverage.value.current === coverage.value.total, icon: 'i-lucide-languages' },
  { label: 'Image assigned', ok: healthFlags.value.hasImage, icon: 'i-lucide-image' },
  { label: 'Effects defined', ok: healthFlags.value.hasEffects, icon: 'i-lucide-zap' },
  { label: 'Dependencies ready', ok: healthFlags.value.dependencyHealth === 'ok', icon: 'i-lucide-git-branch' },
  { label: 'No open feedback', ok: openFeedbackCount.value === 0, icon: 'i-lucide-message-circle' },
  { label: 'Status: approved', ok: entity.value.status === 'approved', icon: 'i-lucide-check-circle' },
])

// --- Mock dependencies ---
interface MockDependency {
  id: number
  name: string
  type: string
  status: EditorialStatus
  relation: string
}
const mockDependencies = ref<MockDependency[]>([
  { id: 101, name: 'Major Arcana', type: 'arcana', status: 'published', relation: 'belongs_to' },
  { id: 102, name: 'Innocence', type: 'facet', status: 'approved', relation: 'has_facet' },
  { id: 103, name: 'Journey', type: 'skill', status: 'draft', relation: 'has_skill' },
])

// --- World card split view ---
const isWorldCard = computed(() => entity.value.entity_type === 'world_card')
const showBaseCardView = ref(false)

// --- Side panel ---
const panelOpen = ref(true)
type PanelTab = 'metadata' | 'translations' | 'editorial' | 'dependencies' | 'feedback'
const activeTab = ref<PanelTab>('metadata')

const panelTabs = computed(() => {
  const tabs = [
    { value: 'metadata', label: 'Metadata', icon: 'i-lucide-file-text' },
    { value: 'translations', label: 'Translations', icon: 'i-lucide-languages' },
    { value: 'editorial', label: 'Editorial', icon: 'i-lucide-git-branch' },
    { value: 'dependencies', label: 'Deps', icon: 'i-lucide-network' },
    { value: 'feedback', label: 'Feedback', icon: 'i-lucide-message-square', badge: openFeedbackCount.value > 0 ? openFeedbackCount.value : null },
  ]
  return tabs
})

// --- Mock feedback ---
const feedbackItems = ref([
  { id: 1, author: 'alice', text: 'Card description needs more detail about the journey aspect.', status: 'open' as const, created_at: '2026-02-10T14:30:00Z' },
  { id: 2, author: 'bob', text: 'Image looks great, approved for this card.', status: 'resolved' as const, created_at: '2026-02-09T10:15:00Z' },
  { id: 3, author: 'carol', text: 'FR translation needs review — "Le Mat" vs "Le Fou" debate.', status: 'open' as const, created_at: '2026-02-11T09:00:00Z' },
])

// --- Entity selector + prev/next navigation ---
const entitySelectorOpen = ref(false)
const entityIndex = computed(() => allEntities.findIndex(e => e.id === entity.value.id))
const hasPrevEntity = computed(() => entityIndex.value > 0)
const hasNextEntity = computed(() => entityIndex.value >= 0 && entityIndex.value < allEntities.length - 1)

function selectEntity(e: MockEntity) {
  entity.value = { ...e }
  cardFields.en.title = e.name
  entitySelectorOpen.value = false
  toast.add({ title: `Editing: ${e.name}`, color: 'neutral', icon: 'i-lucide-edit' })
}
function navPrevEntity() { if (hasPrevEntity.value) selectEntity(allEntities[entityIndex.value - 1]) }
function navNextEntity() { if (hasNextEntity.value) selectEntity(allEntities[entityIndex.value + 1]) }

// --- Fullscreen preview ---
const fullscreenPreview = ref(false)

// --- Mini timeline (simulated editorial history) ---
const miniTimeline = computed(() => [
  { action: 'Created', by: entity.value.created_by ?? entity.value.updated_by, at: entity.value.created_at, icon: 'i-lucide-plus-circle' },
  { action: `Status → ${editorialStatusMeta(entity.value.status).label}`, by: entity.value.editorial_state?.updated_by ?? entity.value.updated_by, at: entity.value.editorial_state?.updated_at ?? entity.value.modified_at, icon: editorialStatusMeta(entity.value.status).icon },
  { action: 'Last modified', by: entity.value.updated_by, at: entity.value.modified_at, icon: 'i-lucide-pencil' },
])
</script>

<template>
  <div class="min-h-screen bg-default flex flex-col">
    <!-- Status bar -->
    <header class="sticky top-0 z-30 border-b border-default bg-default/95 backdrop-blur-sm">
      <div class="flex items-center justify-between px-4 py-2 max-w-[1600px] mx-auto">
        <!-- Left: back + entity name -->
        <div class="flex items-center gap-3 min-w-0">
          <NuxtLink to="/sketches" class="text-muted hover:text-primary transition-colors shrink-0" aria-label="Back to sketches">
            <UIcon name="i-lucide-arrow-left" />
          </NuxtLink>
          <button
            class="flex items-center gap-1.5 min-w-0 hover:text-primary transition-colors"
            aria-label="Switch entity"
            @click="entitySelectorOpen = !entitySelectorOpen"
          >
            <h1 class="text-sm font-bold truncate">{{ entity.name }}</h1>
            <UIcon name="i-lucide-chevron-down" class="text-xs text-muted shrink-0" />
          </button>
          <UBadge color="neutral" variant="outline" size="xs">
            {{ entity.entity_type }}
          </UBadge>
          <UBadge v-if="entity.world" color="primary" variant="subtle" size="xs" icon="i-lucide-globe">{{ entity.world.name }}</UBadge>
          <UBadge v-else color="neutral" variant="subtle" size="xs">Base System</UBadge>
          <template v-if="entity.version_semver">
            <UBadge color="neutral" variant="outline" size="xs">
              v{{ entity.version_semver }}
            </UBadge>
            <span
              :class="`inline-block w-2 h-2 rounded-full shrink-0 ${releaseStageDot(entity.release_stage)}`"
              :title="releaseStageLabel(entity.release_stage)"
            />
          </template>
          <!-- Prev/Next entity nav -->
          <div class="flex items-center gap-0.5 ml-1">
            <UButton icon="i-lucide-chevron-left" size="xs" variant="ghost" color="neutral" :disabled="!hasPrevEntity" aria-label="Previous entity" @click="navPrevEntity" />
            <span class="text-[10px] text-muted tabular-nums">{{ entityIndex + 1 }}/{{ allEntities.length }}</span>
            <UButton icon="i-lucide-chevron-right" size="xs" variant="ghost" color="neutral" :disabled="!hasNextEntity" aria-label="Next entity" @click="navNextEntity" />
          </div>
        </div>

        <!-- Center: editorial indicator -->
        <div class="hidden md:flex items-center gap-3">
          <EntityEditorialIndicator
            :editorial-state="entity.editorial_state"
            :version-semver="entity.version_semver"
            :release-stage="entity.release_stage"
            :publish-ready="entity.editorial?.publishReady ?? false"
            :next-action="primaryTransition ? editorialStatusMeta(primaryTransition).label : null"
          />
        </div>

        <!-- Right: language + transition + panel toggle -->
        <div class="flex items-center gap-2">
          <!-- Language selector -->
          <div class="flex items-center rounded-md border border-default overflow-hidden">
            <button
              v-for="lang in languages"
              :key="lang"
              class="px-2 py-1 text-xs font-medium transition-colors"
              :class="currentLang === lang ? 'bg-primary text-white' : 'text-muted hover:text-primary'"
              :aria-label="`Switch to ${lang.toUpperCase()}`"
              :aria-pressed="currentLang === lang"
              @click="currentLang = lang"
            >
              {{ lang.toUpperCase() }}
            </button>
          </div>

          <!-- Quick transition -->
          <UButton
            v-if="primaryTransition"
            :label="editorialStatusMeta(primaryTransition).label"
            :icon="editorialStatusMeta(primaryTransition).icon"
            size="xs"
            variant="soft"
            :aria-label="`Transition to ${editorialStatusMeta(primaryTransition).label}`"
            @click="applyTransition(primaryTransition!)"
          />

          <!-- Panel toggle -->
          <UButton
            :icon="panelOpen ? 'i-lucide-panel-right-close' : 'i-lucide-panel-right-open'"
            size="xs"
            variant="ghost"
            color="neutral"
            :aria-label="panelOpen ? 'Close side panel' : 'Open side panel'"
            @click="panelOpen = !panelOpen"
          />
        </div>
      </div>

      <!-- Cross-navigation -->
      <SketchCrossNav :entity-name="entity.name" current-view="studio" />

      <!-- Mobile editorial indicator -->
      <div class="md:hidden px-4 pb-2">
        <EntityEditorialIndicator
          :editorial-state="entity.editorial_state"
          :version-semver="entity.version_semver"
          :release-stage="entity.release_stage"
          compact
        />
      </div>
    </header>

    <!-- Entity selector dropdown -->
    <div v-if="entitySelectorOpen" class="fixed inset-0 z-20" @click="entitySelectorOpen = false">
      <div class="absolute top-12 left-16 w-72 rounded-lg border border-default bg-default shadow-lg p-2 space-y-1" @click.stop>
        <button
          v-for="e in allEntities"
          :key="e.id"
          class="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted/30 transition-colors flex items-center justify-between"
          :class="e.id === entity.id ? 'bg-primary/10 text-primary' : ''"
          :aria-label="`Edit ${e.name}`"
          @click="selectEntity(e)"
        >
          <span class="truncate">{{ e.name }}</span>
          <UBadge color="neutral" variant="outline" size="xs">{{ e.entity_type }}</UBadge>
        </button>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Card preview area -->
      <main class="flex-1 flex items-start justify-center p-6 overflow-y-auto">
        <div class="w-full max-w-md">
          <!-- Card frame -->
          <div class="relative rounded-2xl border-2 border-default bg-elevated shadow-xl overflow-hidden">
            <!-- Status overlay -->
            <div class="absolute top-3 left-3 z-10">
              <UBadge
                :color="statusMeta.color"
                :variant="statusMeta.variant"
                :icon="statusMeta.icon"
                size="sm"
                class="shadow-sm"
                :aria-label="`Status: ${statusMeta.label}`"
              >
                {{ statusMeta.label }}
              </UBadge>
            </div>

            <!-- Language badge -->
            <div class="absolute top-3 right-3 z-10">
              <UBadge color="neutral" variant="soft" size="xs">
                {{ currentLang.toUpperCase() }}
              </UBadge>
            </div>

            <!-- Image area (tarot ratio ~2:3.5) -->
            <div
              class="relative w-full bg-muted/20 transition-colors"
              style="aspect-ratio: 2 / 3;"
              :class="{ 'bg-primary/5 border-2 border-dashed border-primary/30': isUploadHover && !cardImageUrl }"
              @dragover.prevent="isUploadHover = true"
              @dragleave="isUploadHover = false"
              @drop.prevent="isUploadHover = false; mockUploadImage()"
            >
              <img
                v-if="cardImageUrl"
                :src="cardImageUrl"
                :alt="`Card image for ${currentFields.title}`"
                class="w-full h-full object-cover"
              >
              <div v-else class="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <UIcon name="i-lucide-image-plus" class="text-4xl text-muted" />
                <p class="text-xs text-muted text-center px-4">
                  Drag & drop an image or click to upload
                </p>
                <UButton
                  label="Upload Image"
                  icon="i-lucide-upload"
                  size="xs"
                  variant="soft"
                  aria-label="Upload card image"
                  @click="mockUploadImage"
                />
              </div>

              <!-- Image actions overlay -->
              <div v-if="cardImageUrl" class="absolute bottom-2 right-2 flex gap-1">
                <UButton
                  icon="i-lucide-refresh-cw"
                  size="xs"
                  variant="soft"
                  color="neutral"
                  class="backdrop-blur-sm"
                  aria-label="Replace image"
                  @click="mockUploadImage"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  size="xs"
                  variant="soft"
                  color="error"
                  class="backdrop-blur-sm"
                  aria-label="Remove image"
                  @click="removeImage"
                />
              </div>
            </div>

            <!-- Card text content -->
            <div class="p-5 space-y-3">
              <!-- Title (editable) -->
              <input
                v-model="cardFields[currentLang].title"
                type="text"
                class="w-full text-xl font-bold bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted/50"
                :placeholder="`Title (${currentLang.toUpperCase()})`"
                :aria-label="`Card title in ${currentLang.toUpperCase()}`"
              >

              <!-- Subtitle -->
              <input
                v-model="cardFields[currentLang].subtitle"
                type="text"
                class="w-full text-sm text-muted bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted/50"
                :placeholder="`Subtitle (${currentLang.toUpperCase()})`"
                :aria-label="`Card subtitle in ${currentLang.toUpperCase()}`"
              >

              <USeparator />

              <!-- Description -->
              <textarea
                v-model="cardFields[currentLang].description"
                rows="4"
                class="w-full text-sm bg-transparent border-none outline-none focus:ring-0 resize-none placeholder:text-muted/50 leading-relaxed"
                :placeholder="`Description (${currentLang.toUpperCase()})`"
                :aria-label="`Card description in ${currentLang.toUpperCase()}`"
              />

              <!-- Keywords -->
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-tag" class="text-xs text-muted shrink-0" />
                <input
                  v-model="cardFields[currentLang].keywords"
                  type="text"
                  class="w-full text-xs text-muted bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted/50"
                  :placeholder="`Keywords (${currentLang.toUpperCase()})`"
                  :aria-label="`Card keywords in ${currentLang.toUpperCase()}`"
                >
              </div>
            </div>
          </div>

          <!-- Card actions below -->
          <div class="mt-4 flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <UAvatar :src="avatarUrl(entity.updated_by)" :alt="entity.updated_by" size="2xs" />
              <span class="text-xs text-muted">#{{ entity.code }} · {{ entity.updated_by }} · {{ relativeTime(entity.modified_at) }}</span>
            </div>
            <div class="flex gap-2">
              <UButton label="Save" icon="i-lucide-save" size="xs" aria-label="Save card changes" @click="toast.add({ title: 'Changes saved (mock)', color: 'success', icon: 'i-lucide-check' })" />
              <UButton label="Preview" icon="i-lucide-eye" size="xs" variant="soft" color="neutral" aria-label="Preview card" @click="fullscreenPreview = true" />
            </div>
          </div>
        </div>
      </main>

      <!-- Side panel -->
      <aside
        v-if="panelOpen"
        class="w-80 lg:w-96 border-l border-default bg-default overflow-y-auto shrink-0"
      >
        <!-- Panel tabs -->
        <div class="sticky top-0 z-10 bg-default border-b border-default">
          <div class="flex">
            <button
              v-for="tab in panelTabs"
              :key="tab.value"
              class="flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors border-b-2"
              :class="activeTab === tab.value ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-primary'"
              :aria-label="tab.label"
              :aria-selected="activeTab === tab.value"
              role="tab"
              @click="activeTab = tab.value as PanelTab"
            >
              <UIcon :name="tab.icon" class="text-sm" />
              <span class="hidden lg:inline">{{ tab.label }}</span>
              <span v-if="tab.badge" class="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-warning text-white text-[9px] font-bold">{{ tab.badge }}</span>
            </button>
          </div>
        </div>

        <div class="p-4">
          <!-- Metadata tab -->
          <div v-if="activeTab === 'metadata'" class="space-y-4">
            <UFormField label="Code" description="Unique identifier">
              <UInput :model-value="entity.code" readonly class="w-full" />
            </UFormField>

            <UFormField label="Entity Type">
              <UInput :model-value="entity.entity_type" readonly class="w-full" />
            </UFormField>

            <UFormField label="Tags">
              <div class="flex flex-wrap gap-1">
                <UBadge
                  v-for="tag in entity.tags"
                  :key="tag.id"
                  color="neutral"
                  variant="soft"
                  size="xs"
                >
                  {{ tag.name }}
                </UBadge>
                <UButton icon="i-lucide-plus" size="xs" variant="ghost" color="neutral" aria-label="Add tag" @click="toast.add({ title: 'Tag picker (mock)', color: 'neutral' })" />
              </div>
            </UFormField>

            <UFormField label="Created">
              <div class="flex items-center gap-1.5">
                <UAvatar :src="avatarUrl(entity.created_by ?? entity.updated_by)" :alt="entity.created_by ?? entity.updated_by" size="2xs" />
                <span class="text-xs text-muted">{{ entity.created_by ?? entity.updated_by }} · {{ relativeTime(entity.created_at) }}</span>
              </div>
            </UFormField>

            <UFormField label="Last Modified">
              <div class="flex items-center gap-1.5">
                <UAvatar :src="avatarUrl(entity.updated_by)" :alt="entity.updated_by" size="2xs" />
                <span class="text-xs text-muted">{{ entity.updated_by }} · {{ relativeTime(entity.modified_at) }}</span>
              </div>
            </UFormField>

            <UFormField label="Active">
              <USwitch :model-value="entity.is_active" aria-label="Toggle active status" @update:model-value="entity.is_active = $event" />
            </UFormField>
          </div>

          <!-- Translations tab -->
          <div v-if="activeTab === 'translations'" class="space-y-4">
            <div class="p-3 rounded-lg bg-muted/10 border border-default">
              <EntityEditorialIndicator
                :editorial-state="entity.editorial_state"
                :version-semver="entity.version_semver"
                compact
              />
            </div>

            <div
              v-for="t in entity.translations"
              :key="t.lang"
              class="rounded-lg border border-default overflow-hidden"
            >
              <div class="flex items-center justify-between px-3 py-2 bg-muted/10">
                <div class="flex items-center gap-2">
                  <UBadge color="neutral" variant="outline" size="xs">{{ t.lang.toUpperCase() }}</UBadge>
                  <span class="text-xs font-medium">
                    {{ t.lang === 'en' ? 'English (base)' : t.lang === 'fr' ? 'French' : 'Spanish' }}
                  </span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span :class="`inline-block w-2 h-2 rounded-full ${translationStatusDot(t.status).dot}`" />
                  <UBadge
                    :color="t.has_translation && !t.is_fallback ? 'success' : t.status === 'draft' || t.status === 'changes_requested' ? 'warning' : 'neutral'"
                    variant="soft"
                    size="xs"
                  >
                    {{ t.has_translation && !t.is_fallback ? (t.status ?? 'Complete') : 'Missing' }}
                  </UBadge>
                </div>
              </div>
              <div class="px-3 py-2">
                <button
                  class="text-xs text-primary hover:underline"
                  :aria-label="`Edit ${t.lang.toUpperCase()} translation`"
                  @click="currentLang = t.lang"
                >
                  {{ currentLang === t.lang ? '← Currently editing' : `Switch to ${t.lang.toUpperCase()}` }}
                </button>
              </div>
            </div>
          </div>

          <!-- Editorial tab -->
          <div v-if="activeTab === 'editorial'" class="space-y-4">
            <!-- Current status -->
            <div class="p-3 rounded-lg border border-default">
              <p class="text-xs text-muted mb-2">Current Status</p>
              <UBadge
                :color="statusMeta.color"
                :variant="statusMeta.variant"
                :icon="statusMeta.icon"
                size="sm"
                :aria-label="`Current status: ${statusMeta.label}`"
              >
                {{ statusMeta.label }}
              </UBadge>
            </div>

            <!-- Available transitions -->
            <div>
              <p class="text-xs text-muted mb-2">Available Transitions</p>
              <div v-if="nextTransitions.length" class="space-y-2">
                <UButton
                  v-for="t in nextTransitions"
                  :key="t"
                  :label="editorialStatusMeta(t).label"
                  :icon="editorialStatusMeta(t).icon"
                  size="xs"
                  variant="soft"
                  :color="editorialStatusMeta(t).color"
                  class="w-full justify-start"
                  :aria-label="`Transition to ${editorialStatusMeta(t).label}`"
                  @click="applyTransition(t)"
                />
              </div>
              <p v-else class="text-xs text-muted italic">No transitions available from this state.</p>
            </div>

            <!-- Blocking reasons -->
            <div v-if="entity.editorial?.blockingReasons.length">
              <p class="text-xs text-muted mb-2">Blocking Reasons</p>
              <div class="space-y-1">
                <div
                  v-for="(reason, idx) in entity.editorial.blockingReasons"
                  :key="idx"
                  class="flex items-start gap-2 text-xs text-warning"
                >
                  <UIcon name="i-lucide-alert-triangle" class="shrink-0 mt-0.5" />
                  <span>{{ reason }}</span>
                </div>
              </div>
            </div>

            <!-- Publish Readiness Checklist -->
            <div>
              <p class="text-xs text-muted mb-2">Publish Readiness</p>
              <div class="rounded-lg border border-default divide-y divide-default">
                <div
                  v-for="check in readinessChecks"
                  :key="check.label"
                  class="flex items-center gap-2.5 px-3 py-2"
                >
                  <UIcon
                    :name="check.ok ? 'i-lucide-check-circle' : 'i-lucide-circle-x'"
                    :class="check.ok ? 'text-emerald-500' : 'text-red-400'"
                    class="text-sm shrink-0"
                  />
                  <UIcon :name="check.icon" class="text-xs text-muted shrink-0" />
                  <span class="text-xs" :class="check.ok ? 'text-default' : 'text-muted'">{{ check.label }}</span>
                </div>
              </div>
              <div class="mt-2 p-2 rounded-md text-center" :class="entity.editorial?.publishReady ? 'bg-emerald-500/10' : 'bg-red-500/5'">
                <span class="text-xs font-medium" :class="entity.editorial?.publishReady ? 'text-emerald-500' : 'text-red-400'">
                  {{ entity.editorial?.publishReady ? '✓ Ready to publish' : `${readinessChecks.filter(c => !c.ok).length} items remaining` }}
                </span>
              </div>
            </div>

            <!-- Mini timeline -->
            <div>
              <p class="text-xs text-muted mb-2">Timeline</p>
              <div class="space-y-0">
                <div v-for="(event, idx) in miniTimeline" :key="idx" class="flex items-start gap-2 relative pl-4 pb-3">
                  <div class="absolute left-0 top-1 w-2 h-2 rounded-full bg-muted/50" />
                  <div v-if="idx < miniTimeline.length - 1" class="absolute left-[3px] top-3 w-0.5 h-full bg-muted/20" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                      <UIcon :name="event.icon" class="text-[10px] text-muted shrink-0" />
                      <span class="text-xs font-medium">{{ event.action }}</span>
                    </div>
                    <div class="flex items-center gap-1 mt-0.5">
                      <UAvatar :src="avatarUrl(event.by)" :alt="event.by" size="3xs" />
                      <span class="text-[10px] text-muted">{{ event.by }} · {{ relativeTime(event.at) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Dependencies tab -->
          <div v-if="activeTab === 'dependencies'" class="space-y-4">
            <p class="text-xs text-muted">{{ mockDependencies.length }} dependencies</p>

            <div
              v-for="dep in mockDependencies"
              :key="dep.id"
              class="rounded-lg border border-default p-3 space-y-2"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UBadge color="neutral" variant="outline" size="xs">{{ dep.type }}</UBadge>
                  <span class="text-xs font-medium">{{ dep.name }}</span>
                </div>
                <UBadge
                  :color="editorialStatusMeta(dep.status).color"
                  :variant="editorialStatusMeta(dep.status).variant"
                  :icon="editorialStatusMeta(dep.status).icon"
                  size="xs"
                >
                  {{ editorialStatusMeta(dep.status).label }}
                </UBadge>
              </div>
              <div class="flex items-center gap-2 text-[10px] text-muted">
                <UIcon name="i-lucide-link" class="text-[10px]" />
                <span>{{ dep.relation }}</span>
                <span>·</span>
                <span>#{{ dep.id }}</span>
              </div>
            </div>

            <!-- Dependency health summary -->
            <div class="p-3 rounded-lg border border-default">
              <div class="flex items-center gap-2">
                <UIcon
                  :name="healthFlags.dependencyHealth === 'ok' ? 'i-lucide-check-circle' : healthFlags.dependencyHealth === 'warning' ? 'i-lucide-alert-triangle' : 'i-lucide-circle-x'"
                  :class="healthFlags.dependencyHealth === 'ok' ? 'text-emerald-500' : healthFlags.dependencyHealth === 'warning' ? 'text-amber-400' : 'text-red-500'"
                />
                <span class="text-xs font-medium">
                  {{ healthFlags.dependencyHealth === 'ok' ? 'All dependencies ready' : healthFlags.dependencyHealth === 'warning' ? 'Some dependencies in review' : 'Dependencies not ready' }}
                </span>
              </div>
            </div>

            <!-- World card split view toggle -->
            <div v-if="isWorldCard" class="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-split" class="text-primary" />
                <span class="text-xs font-semibold text-primary">World Card</span>
              </div>
              <p class="text-[10px] text-muted">This entity inherits from a base_card. Toggle split view to see base fields (read-only) alongside overrides.</p>
              <UButton
                :label="showBaseCardView ? 'Hide Base Card' : 'Show Base Card'"
                :icon="showBaseCardView ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                size="xs"
                variant="soft"
                color="primary"
                @click="showBaseCardView = !showBaseCardView"
              />
            </div>
          </div>

          <!-- Feedback tab -->
          <div v-if="activeTab === 'feedback'" class="space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-xs text-muted">{{ feedbackItems.length }} comments</p>
              <UButton
                label="Add"
                icon="i-lucide-plus"
                size="xs"
                variant="soft"
                aria-label="Add feedback comment"
                @click="toast.add({ title: 'Add comment (mock)', color: 'neutral' })"
              />
            </div>

            <div
              v-for="fb in feedbackItems"
              :key="fb.id"
              class="rounded-lg border border-default p-3 space-y-2"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UAvatar :src="avatarUrl(fb.author)" :alt="fb.author" size="2xs" />
                  <span class="text-xs font-medium">{{ fb.author }}</span>
                  <span class="text-[10px] text-muted">{{ relativeTime(fb.created_at) }}</span>
                </div>
                <UBadge
                  :color="fb.status === 'open' ? 'warning' : 'success'"
                  variant="soft"
                  size="xs"
                  :aria-label="`Feedback status: ${fb.status}`"
                >
                  {{ fb.status }}
                </UBadge>
              </div>
              <p class="text-xs leading-relaxed">{{ fb.text }}</p>
              <div v-if="fb.status === 'open'" class="flex justify-end">
                <UButton
                  label="Resolve"
                  size="xs"
                  variant="ghost"
                  color="success"
                  icon="i-lucide-check"
                  :aria-label="`Resolve feedback from ${fb.author}`"
                  @click="fb.status = 'resolved'"
                />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Fullscreen preview modal -->
    <UModal v-model:open="fullscreenPreview" fullscreen role="dialog" aria-modal="true">
      <template #body>
        <div class="flex items-center justify-center min-h-[80vh] bg-black/5 p-8">
          <div class="w-full max-w-sm">
            <div class="rounded-2xl border-2 border-default bg-elevated shadow-2xl overflow-hidden">
              <div v-if="cardImageUrl" class="w-full" style="aspect-ratio: 2 / 3;">
                <img :src="cardImageUrl" :alt="currentFields.title" class="w-full h-full object-cover">
              </div>
              <div v-else class="w-full bg-muted/20 flex items-center justify-center" style="aspect-ratio: 2 / 3;">
                <UIcon name="i-lucide-image" class="text-4xl text-muted" />
              </div>
              <div class="p-5 space-y-2">
                <h2 class="text-xl font-bold">{{ currentFields.title }}</h2>
                <p class="text-sm text-muted">{{ currentFields.subtitle }}</p>
                <p class="text-sm leading-relaxed">{{ currentFields.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-center">
          <UButton label="Close Preview" icon="i-lucide-x" variant="outline" @click="fullscreenPreview = false" />
        </div>
      </template>
    </UModal>

    <!-- Integration notes (bottom) -->
    <div class="border-t border-default p-4 bg-muted/10">
      <p class="text-xs text-muted text-center max-w-3xl mx-auto leading-relaxed">
        <strong>Integration:</strong> Replace <code class="text-xs">EntitySlideover</code> for visual entities.
        Route: <code class="text-xs">/manage/:entity/:id/studio</code>.
        Connect card fields to entity detail API, image to <code class="text-xs">useImageUpload</code>,
        transitions to editorial API, feedback to <code class="text-xs">useFeedback</code>.
      </p>
    </div>
  </div>
</template>
