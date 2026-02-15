<!--
  /pages/sketches/editorial-board.vue
  POC 8: Kanban-style editorial workflow board

  OBJECTIVE:
  Trello/Linear-style board where columns = editorial statuses.
  Cards show entity name, type badge, translation coverage, updated_by, thumbnail.
  Drag-and-drop between columns triggers mock editorial transitions.

  SUCCESS CRITERIA:
  - Feels like Trello/Linear, not admin CRUD
  - Drag-and-drop works (native HTML5, no external libs)
  - Filter by entity type and "missing translations" toggle
  - Mobile: columns scroll horizontally
  - Empty columns show friendly empty state
  - Status change has visual feedback (toast)

  INTEGRATION INTO /manage:
  1. New route: /manage/board (or tab in dashboard)
  2. Replace dashboard.vue grouped lists with this board
  3. Cards link to /manage/:entity/:id/studio or EntitySlideover
  4. Transitions call editorial API endpoints
  5. Filters wire to useManageFilters
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
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

definePageMeta({ layout: 'default' })

const toast = useToast()

// --- Board columns ---
const BOARD_COLUMNS: { status: EditorialStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'pending_review', label: 'Pending Review' },
  { status: 'review', label: 'Review' },
  { status: 'changes_requested', label: 'Changes Requested' },
  { status: 'translation_review', label: 'Translation Review' },
  { status: 'approved', label: 'Approved' },
  { status: 'published', label: 'Published' },
  { status: 'archived', label: 'Archived' },
]

// --- Entities ---
const entities = ref<MockEntity[]>(generateMockEntities(20))

// --- Filters ---
const entityTypeFilter = ref<string | null>(null)
const releaseStageFilter = ref<string | null>(null)
const showMissingOnly = ref(false)
const swimlaneMode = ref(false)
const compactView = ref(false)
const adminOverride = ref(false)

// --- Pinned world version ---
const pinnedWorld = ref<{ name: string; version: string } | null>(null)
const worldOptions = [
  { label: 'No pinned world', value: '' },
  { label: 'Ethereal Realm v1.0.0', value: 'ethereal:1.0.0' },
  { label: 'Shadow Domain v1.1.0', value: 'shadow:1.1.0' },
]
function setPinnedWorld(val: string) {
  if (!val) { pinnedWorld.value = null; return }
  const [name, version] = val.split(':')
  pinnedWorld.value = { name: name ?? '', version: version ?? '' }
}

const releaseStageOptions = [
  { label: 'All stages', value: '' },
  { label: 'Dev', value: 'dev' },
  { label: 'Alfa', value: 'alfa' },
  { label: 'Beta', value: 'beta' },
  { label: 'Candidate', value: 'candidate' },
  { label: 'Release', value: 'release' },
  { label: 'Revision', value: 'revision' },
]

const entityTypes = computed(() => {
  const types = new Set(entities.value.map(e => e.entity_type))
  return [{ label: 'All types', value: '' }, ...Array.from(types).map(t => ({ label: t, value: t }))]
})

const filteredEntities = computed(() => {
  let result = entities.value
  if (entityTypeFilter.value) {
    result = result.filter(e => e.entity_type === entityTypeFilter.value)
  }
  if (releaseStageFilter.value) {
    result = result.filter(e => e.release_stage === releaseStageFilter.value)
  }
  if (showMissingOnly.value) {
    result = result.filter(e => {
      const cov = translationCoverage(e.translations)
      return cov.done < cov.total
    })
  }
  return result
})

function entitiesForColumn(status: EditorialStatus): MockEntity[] {
  return filteredEntities.value.filter(e => e.editorial_state?.status === status)
}

function columnCount(status: EditorialStatus): number {
  return entitiesForColumn(status).length
}

// --- Swimlane grouping ---
function swimlanesForColumn(status: EditorialStatus): { type: string; entities: MockEntity[] }[] {
  const colEntities = entitiesForColumn(status)
  const groups = new Map<string, MockEntity[]>()
  for (const e of colEntities) {
    const list = groups.get(e.entity_type) ?? []
    list.push(e)
    groups.set(e.entity_type, list)
  }
  return Array.from(groups.entries()).map(([type, ents]) => ({ type, entities: ents })).sort((a, b) => a.type.localeCompare(b.type))
}

// --- Drag and drop ---
const draggedEntityId = ref<number | null>(null)
const dragOverColumn = ref<EditorialStatus | null>(null)

function onDragStart(entityId: number) {
  draggedEntityId.value = entityId
}

function onDragEnd() {
  draggedEntityId.value = null
  dragOverColumn.value = null
}

function onDragOverColumn(status: EditorialStatus, event: DragEvent) {
  event.preventDefault()
  dragOverColumn.value = status
}

function onDragLeaveColumn() {
  dragOverColumn.value = null
}

function canTransitionEntity(entity: MockEntity, targetStatus: EditorialStatus): { allowed: boolean; reasons: string[]; adminOnly?: boolean } {
  const currentStatus = entity.editorial_state?.status
  if (!currentStatus) return { allowed: false, reasons: ['No editorial state'] }
  if (currentStatus === targetStatus) return { allowed: false, reasons: ['Already in this status'] }

  const transitionMap = EDITORIAL_TRANSITIONS[currentStatus] ?? []
  const isForwardTransition = transitionMap.includes(targetStatus)

  if (!isForwardTransition) {
    if (adminOverride.value) {
      return { allowed: true, reasons: [`Admin override: backward move from ${editorialStatusMeta(currentStatus).label}`], adminOnly: true }
    }
    return { allowed: false, reasons: [`Cannot move from ${editorialStatusMeta(currentStatus).label} to ${editorialStatusMeta(targetStatus).label}. Enable Admin Override to force backward moves.`] }
  }

  const reasons: string[] = []
  const cov = translationCoverage(entity.translations)

  if (targetStatus === 'published') {
    if (cov.done < cov.total) reasons.push(`Missing translations: ${cov.missing.join(', ')}`)
    if (!entity.image) reasons.push('No image assigned')
    if (entity.editorial?.blockingReasons.some(r => r.includes('effects'))) reasons.push('No effects defined')
  }
  if (targetStatus === 'pending_review' || targetStatus === 'review') {
    if (cov.done === 0) reasons.push('No translations at all')
  }
  return { allowed: reasons.length === 0, reasons }
}

function onDropOnColumn(targetStatus: EditorialStatus) {
  if (!draggedEntityId.value) return

  const idx = entities.value.findIndex(e => e.id === draggedEntityId.value)
  if (idx === -1) return

  const entity = entities.value[idx]!
  const check = canTransitionEntity(entity, targetStatus)

  if (!check.allowed) {
    toast.add({
      title: 'Transition not allowed',
      description: check.reasons.join('. '),
      color: 'error',
      icon: 'i-lucide-x-circle',
    })
    draggedEntityId.value = null
    dragOverColumn.value = null
    return
  }

  const updated = { ...entity }
  updated.status = targetStatus
  updated.editorial_state = { ...entity.editorial_state!, status: targetStatus, updated_by: 'current_user', updated_at: new Date().toISOString() }
  updated.editorial = computeEditorial(targetStatus, updated.translations, { hasImage: !!entity.image, hasEffects: !entity.editorial?.blockingReasons.some(r => r.includes('effects')) })
  entities.value[idx] = updated

  const meta = editorialStatusMeta(targetStatus)
  toast.add({
    title: `${entity.name} → ${meta.label}`,
    color: 'success',
    icon: meta.icon,
  })

  draggedEntityId.value = null
  dragOverColumn.value = null
}

// --- Quick transition (button on card) ---
function quickTransition(entity: MockEntity) {
  const currentStatus = entity.editorial_state?.status
  if (!currentStatus) return
  const next = (EDITORIAL_TRANSITIONS[currentStatus] ?? [])[0]
  if (!next) return

  const check = canTransitionEntity(entity, next)
  if (!check.allowed) {
    toast.add({ title: 'Cannot transition', description: check.reasons.join('. '), color: 'warning', icon: 'i-lucide-alert-triangle' })
    return
  }

  const idx = entities.value.findIndex(e => e.id === entity.id)
  if (idx === -1) return

  const updated = { ...entity }
  updated.status = next
  updated.editorial_state = { ...entity.editorial_state!, status: next, updated_by: 'current_user', updated_at: new Date().toISOString() }
  updated.editorial = computeEditorial(next, updated.translations, { hasImage: !!entity.image, hasEffects: !entity.editorial?.blockingReasons.some(r => r.includes('effects')) })
  entities.value[idx] = updated

  const meta = editorialStatusMeta(next)
  toast.add({ title: `${entity.name} → ${meta.label}`, color: 'success', icon: meta.icon })
}

function nextTransitionLabel(entity: MockEntity): string | null {
  const status = entity.editorial_state?.status
  if (!status) return null
  const next = (EDITORIAL_TRANSITIONS[status] ?? [])[0]
  return next ? editorialStatusMeta(next).label : null
}

// --- Card thumbnail mock ---
function thumbnailUrl(entity: MockEntity): string {
  return `https://picsum.photos/seed/${entity.code}${entity.id}/80/120`
}

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
          <h1 class="text-lg font-bold tracking-tight">Editorial Board</h1>
          <UBadge color="primary" variant="subtle" size="xs">Studio</UBadge>
        </div>

        <div class="flex items-center gap-3">
          <!-- Entity type filter -->
          <USelect
            :model-value="entityTypeFilter ?? ''"
            :items="entityTypes"
            placeholder="All types"
            size="xs"
            class="w-36"
            aria-label="Filter by entity type"
            @update:model-value="entityTypeFilter = $event || null"
          />

          <!-- Release stage filter -->
          <USelect
            :model-value="releaseStageFilter ?? ''"
            :items="releaseStageOptions"
            placeholder="All stages"
            size="xs"
            class="w-32"
            aria-label="Filter by release stage"
            @update:model-value="releaseStageFilter = $event || null"
          />

          <!-- Missing translations toggle -->
          <div class="flex items-center gap-1.5">
            <USwitch
              v-model="showMissingOnly"
              size="xs"
              aria-label="Show only entities with missing translations"
            />
            <span class="text-xs text-muted whitespace-nowrap">Missing translations</span>
          </div>

          <!-- Swimlane toggle -->
          <div class="flex items-center gap-1.5">
            <USwitch v-model="swimlaneMode" size="xs" aria-label="Group cards by entity type (swimlanes)" />
            <span class="text-xs text-muted whitespace-nowrap">Swimlanes</span>
          </div>

          <!-- Compact view -->
          <div class="flex items-center gap-1.5">
            <USwitch v-model="compactView" size="xs" aria-label="Compact card view" />
            <span class="text-xs text-muted whitespace-nowrap">Compact</span>
          </div>

          <!-- Admin override -->
          <div class="flex items-center gap-1.5">
            <USwitch v-model="adminOverride" size="xs" color="error" aria-label="Admin backward override" />
            <span class="text-xs whitespace-nowrap" :class="adminOverride ? 'text-error font-medium' : 'text-muted'">Admin</span>
          </div>

          <!-- Pinned world -->
          <USelect
            :model-value="pinnedWorld ? `${pinnedWorld.name}:${pinnedWorld.version}` : ''"
            :items="worldOptions"
            size="xs"
            class="w-44"
            aria-label="Pin world version"
            @update:model-value="setPinnedWorld($event)"
          />

          <!-- Entity count -->
          <UBadge color="neutral" variant="outline" size="xs">
            {{ filteredEntities.length }} entities
          </UBadge>
        </div>
      </div>
    </header>

    <!-- Pinned world banner -->
    <div v-if="pinnedWorld" class="px-4 py-2 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
      <UIcon name="i-lucide-pin" class="text-primary text-sm" />
      <span class="text-xs font-medium text-primary">Pinned: {{ pinnedWorld.name }} v{{ pinnedWorld.version }}</span>
      <span class="text-[10px] text-muted">— Showing entities in this world context</span>
      <UButton icon="i-lucide-x" size="xs" variant="ghost" color="neutral" class="ml-auto" aria-label="Unpin world" @click="pinnedWorld = null" />
    </div>

    <!-- Board -->
    <div class="flex-1 overflow-x-auto">
      <div class="flex gap-4 p-4 min-w-max h-full">
        <!-- Column -->
        <div
          v-for="col in BOARD_COLUMNS"
          :key="col.status"
          class="w-72 flex flex-col rounded-xl border border-default bg-(--ui-bg-elevated)/50 shrink-0 transition-colors"
          :class="{
            'border-primary/50 bg-primary/5': dragOverColumn === col.status,
          }"
          @dragover="onDragOverColumn(col.status, $event)"
          @dragleave="onDragLeaveColumn"
          @drop="onDropOnColumn(col.status)"
        >
          <!-- Column header -->
          <div class="flex items-center justify-between px-3 py-2.5 border-b border-default">
            <div class="flex items-center gap-2">
              <UBadge
                :color="editorialStatusMeta(col.status).color"
                :variant="editorialStatusMeta(col.status).variant"
                :icon="editorialStatusMeta(col.status).icon"
                size="xs"
              >
                {{ col.label }}
              </UBadge>
            </div>
            <span class="text-xs text-muted tabular-nums">{{ columnCount(col.status) }}</span>
          </div>

          <!-- Column body -->
          <div class="flex-1 overflow-y-auto p-2 space-y-2 min-h-32">
            <!-- Swimlane mode -->
            <template v-if="swimlaneMode">
              <div
                v-for="lane in swimlanesForColumn(col.status)"
                :key="lane.type"
                class="space-y-1.5"
              >
                <div class="flex items-center gap-1.5 px-1 pt-1">
                  <span class="text-[9px] font-semibold uppercase tracking-wider text-muted">{{ lane.type }}</span>
                  <span class="text-[9px] text-muted/50 tabular-nums">{{ lane.entities.length }}</span>
                </div>
                <div
                  v-for="entity in lane.entities"
                  :key="entity.id"
                  class="rounded-lg border border-default bg-default p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-all hover:shadow-sm"
                  :class="{ 'opacity-40 scale-95': draggedEntityId === entity.id }"
                  draggable="true"
                  :aria-label="`${entity.name}, ${entity.entity_type}, ${editorialStatusMeta(entity.status).label}`"
                  @dragstart="onDragStart(entity.id)"
                  @dragend="onDragEnd"
                >
                  <div class="flex gap-2.5">
                    <img :src="thumbnailUrl(entity)" :alt="`Thumbnail for ${entity.name}`" class="w-10 h-14 rounded object-cover shrink-0 bg-muted/20" loading="lazy">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5">
                        <p class="text-sm font-medium truncate">{{ entity.name }}</p>
                        <span v-if="entity.version_semver" class="text-[10px] text-muted tabular-nums shrink-0">v{{ entity.version_semver }}</span>
                      </div>
                      <div class="flex items-center gap-1 mt-1">
                        <span
                          v-for="t in entity.translations"
                          :key="t.lang"
                          class="flex items-center gap-0.5"
                          :title="t.has_translation && !t.is_fallback ? `${t.lang.toUpperCase()}: ${translationStatusDot(t.status).label}` : `${t.lang.toUpperCase()}: missing`"
                        >
                          <span :class="`inline-block w-1.5 h-1.5 rounded-full ${translationStatusDot(t.status).dot}`" />
                        </span>
                        <span v-if="entity.editorial?.blockingReasons.length" class="ml-auto text-[9px] text-warning flex items-center gap-0.5" :title="entity.editorial.blockingReasons.join('\n')">
                          <UIcon name="i-lucide-alert-triangle" class="text-[10px]" />
                          {{ entity.editorial.blockingReasons.length }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div v-if="!compactView" class="flex items-center justify-between mt-2 pt-2 border-t border-default">
                    <div class="flex items-center gap-1">
                      <UAvatar :src="avatarUrl(entity.updated_by)" :alt="entity.updated_by" size="3xs" />
                      <span class="text-[10px] text-muted truncate">{{ relativeTime(entity.modified_at) }}</span>
                    </div>
                    <UButton
                      v-if="nextTransitionLabel(entity)"
                      :label="nextTransitionLabel(entity)!"
                      size="xs"
                      variant="ghost"
                      color="primary"
                      class="text-[10px]"
                      @click.stop="quickTransition(entity)"
                    />
                  </div>
                </div>
              </div>
            </template>

            <!-- Normal mode: Cards -->
            <template v-else>
            <div
              v-for="entity in entitiesForColumn(col.status)"
              :key="entity.id"
              class="rounded-lg border border-default bg-default p-3 cursor-grab active:cursor-grabbing hover:border-primary/40 transition-all hover:shadow-sm"
              :class="{ 'opacity-40 scale-95': draggedEntityId === entity.id }"
              draggable="true"
              :aria-label="`${entity.name}, ${entity.entity_type}, ${editorialStatusMeta(entity.status).label}`"
              @dragstart="onDragStart(entity.id)"
              @dragend="onDragEnd"
            >
              <div class="flex gap-2.5">
                <!-- Thumbnail -->
                <img
                  :src="thumbnailUrl(entity)"
                  :alt="`Thumbnail for ${entity.name}`"
                  class="w-10 h-14 rounded object-cover shrink-0 bg-muted/20"
                  loading="lazy"
                >

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <p class="text-sm font-medium truncate">{{ entity.name }}</p>
                    <span v-if="entity.version_semver" class="text-[10px] text-muted tabular-nums shrink-0">v{{ entity.version_semver }}</span>
                    <span v-if="entity.release_stage" :class="`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${releaseStageDot(entity.release_stage)}`" :title="releaseStageLabel(entity.release_stage)" />
                  </div>
                  <div class="flex items-center gap-1.5 mt-1">
                    <UBadge color="neutral" variant="outline" size="xs">
                      {{ entity.entity_type }}
                    </UBadge>
                  </div>
                  <!-- Per-lang translation dots -->
                  <div class="flex items-center gap-1 mt-1">
                    <span
                      v-for="t in entity.translations"
                      :key="t.lang"
                      class="flex items-center gap-0.5"
                      :title="t.has_translation && !t.is_fallback ? `${t.lang.toUpperCase()}: ${translationStatusDot(t.status).label}` : `${t.lang.toUpperCase()}: missing`"
                    >
                      <span :class="`inline-block w-1.5 h-1.5 rounded-full ${translationStatusDot(t.status).dot}`" />
                      <span class="text-[9px] text-muted">{{ t.lang.toUpperCase() }}</span>
                    </span>
                    <span v-if="entity.editorial?.blockingReasons.length" class="ml-auto text-[9px] text-warning flex items-center gap-0.5" :title="entity.editorial.blockingReasons.join('\n')">
                      <UIcon name="i-lucide-alert-triangle" class="text-[10px]" />
                      {{ entity.editorial.blockingReasons.length }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div v-if="!compactView" class="flex items-center justify-between mt-2 pt-2 border-t border-default">
                <div class="flex items-center gap-1">
                  <UAvatar :src="avatarUrl(entity.updated_by)" :alt="entity.updated_by" size="3xs" />
                  <span class="text-[10px] text-muted truncate">{{ relativeTime(entity.modified_at) }}</span>
                </div>
                <UButton
                  v-if="nextTransitionLabel(entity)"
                  :label="nextTransitionLabel(entity)!"
                  size="xs"
                  variant="ghost"
                  color="primary"
                  class="text-[10px]"
                  :aria-label="`Move ${entity.name} to ${nextTransitionLabel(entity)}`"
                  @click.stop="quickTransition(entity)"
                />
              </div>
            </div>
            </template>

            <!-- Empty state -->
            <div
              v-if="!entitiesForColumn(col.status).length"
              class="flex flex-col items-center justify-center py-8 text-center"
            >
              <UIcon :name="editorialStatusMeta(col.status).icon" class="text-2xl text-muted/40 mb-2" />
              <p class="text-xs text-muted/60">
                No entities in {{ col.label }}
              </p>
              <p v-if="entityTypeFilter || showMissingOnly" class="text-[10px] text-muted/40 mt-1">
                Try adjusting filters
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Integration notes -->
    <div class="border-t border-default p-4 bg-muted/10">
      <p class="text-xs text-muted text-center max-w-3xl mx-auto leading-relaxed">
        <strong>Integration:</strong> New route <code class="text-xs">/manage/board</code> or tab in dashboard.
        Replace <code class="text-xs">dashboard.vue</code> grouped lists.
        Cards link to <code class="text-xs">/manage/:entity/:id/studio</code>.
        Drag-and-drop calls editorial transition API.
        Filters wire to <code class="text-xs">useManageFilters</code>.
      </p>
    </div>
  </div>
</template>
