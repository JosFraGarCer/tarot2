<!-- app/pages/manage/board.vue -->
<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <!-- Header -->
    <header class="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
      <div class="mx-auto flex items-center justify-between gap-3 px-4 py-2 max-w-screen-2xl">
        <div class="flex items-center gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            size="xs"
            icon="i-heroicons-arrow-left"
            :aria-label="tt('ui.actions.back', 'Back')"
            @click="router.push('/manage')"
          />
          <USeparator direction="vertical" class="h-5 mx-1" />
          <h1 class="text-sm font-bold">
            {{ tt('features.editorial.boardTitle', 'Editorial Board') }}
          </h1>
        </div>

        <div class="flex items-center gap-2">
          <!-- Entity type filter -->
          <USelectMenu
            v-model="filters.entityType"
            :items="entityTypeOptions"
            value-key="value"
            option-attribute="label"
            size="xs"
            class="w-36"
          />

          <!-- World filter -->
          <USelectMenu
            v-if="worldOptions.length"
            v-model="selectedWorldId"
            :items="worldFilterOptions"
            value-key="value"
            option-attribute="label"
            size="xs"
            class="w-36"
            :placeholder="tt('ui.filters.world', 'World')"
          />

          <USeparator direction="vertical" class="h-5 mx-1" />

          <UButton
            icon="i-heroicons-arrow-path"
            color="neutral"
            variant="soft"
            size="xs"
            :loading="loading"
            :aria-label="tt('ui.actions.refresh', 'Refresh')"
            @click="fetchAll"
          />
        </div>
      </div>
    </header>

    <!-- Error -->
    <div v-if="error" class="mx-auto max-w-screen-2xl px-4 py-4">
      <UAlert
        color="error"
        icon="i-heroicons-exclamation-triangle"
        :title="tt('errors.loadFailed', 'Failed to load board')"
        :description="error"
      />
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading && !entities.length" class="mx-auto max-w-screen-2xl px-4 py-6">
      <div class="flex gap-4 overflow-x-auto pb-4">
        <div v-for="i in 5" :key="i" class="shrink-0 w-64">
          <USkeleton class="h-8 w-full mb-3" />
          <USkeleton v-for="j in 3" :key="j" class="h-28 w-full mb-2" />
        </div>
      </div>
    </div>

    <!-- Board -->
    <div v-else class="mx-auto max-w-screen-2xl px-4 py-4">
      <div class="flex gap-3 overflow-x-auto pb-6" role="region" :aria-label="tt('features.editorial.boardTitle', 'Editorial Board')">
        <div
          v-for="col in columns"
          :key="col.status"
          class="shrink-0 w-64 flex flex-col"
        >
          <!-- Column header -->
          <div class="flex items-center justify-between gap-2 mb-2 px-1">
            <div class="flex items-center gap-1.5">
              <UBadge
                :color="statusColor(col.status)"
                :variant="statusVariant(col.status)"
                size="xs"
              >
                {{ t(statusLabelKey(col.status)) }}
              </UBadge>
              <span class="text-xs text-neutral-400">{{ col.items.length }}</span>
            </div>
          </div>

          <!-- Drop zone -->
          <div
            class="flex-1 min-h-32 rounded-lg border-2 border-dashed border-transparent p-1.5 space-y-1.5 transition-colors"
            :class="{
              'border-primary-300 bg-primary-50/50 dark:border-primary-700 dark:bg-primary-950/30': dragOverColumn === col.status,
              'border-neutral-200 dark:border-neutral-800': dragOverColumn !== col.status,
            }"
            @dragover.prevent="onDragOver($event, col.status)"
            @dragleave="onDragLeave(col.status)"
            @drop.prevent="onDrop(col.status)"
          >
            <div v-if="!col.items.length" class="flex items-center justify-center h-24 text-xs text-neutral-400 italic">
              {{ tt('features.editorial.emptyColumn', 'No items') }}
            </div>

            <!-- Entity cards -->
            <div
              v-for="entity in col.items"
              :key="`${entity.entity_type}-${entity.id}`"
              class="group relative rounded-lg border bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900 cursor-grab active:cursor-grabbing"
              :class="{
                'opacity-50 pointer-events-none': isTransitioning(entity),
              }"
              draggable="true"
              :aria-label="`${entity.name} — ${entity.entity_type}`"
              @dragstart="onDragStart($event, entity)"
              @dragend="onDragEnd"
            >
              <!-- Card content -->
              <div class="flex gap-2">
                <!-- Thumbnail -->
                <div class="shrink-0 w-10 h-14 rounded overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <img
                    v-if="entity.image"
                    :src="entity.image"
                    :alt="entity.name"
                    class="w-full h-full object-cover"
                  >
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <UIcon name="i-heroicons-photo" class="text-neutral-300 dark:text-neutral-600 size-4" />
                  </div>
                </div>

                <!-- Info -->
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold truncate text-neutral-900 dark:text-neutral-100">
                    {{ entity.name || entity.code }}
                  </p>
                  <UBadge size="xs" color="neutral" variant="outline" class="mt-0.5">
                    {{ entityTypeLabel(entity.entity_type) }}
                  </UBadge>
                </div>
              </div>

              <!-- Meta row -->
              <div class="mt-1.5 flex flex-wrap items-center gap-1">
                <!-- Version -->
                <UBadge
                  v-if="entity.version_semver"
                  size="xs"
                  color="neutral"
                  variant="subtle"
                >
                  {{ entity.version_semver }}
                  <template v-if="entity.release_stage">
                    · {{ entity.release_stage }}
                  </template>
                </UBadge>

                <!-- World -->
                <UBadge
                  v-if="entity.world_name"
                  size="xs"
                  color="primary"
                  variant="subtle"
                >
                  {{ entity.world_name }}
                </UBadge>

                <!-- Translation summary -->
                <span
                  v-if="entity.translation_states && entity.translation_states.length"
                  class="text-[10px] text-neutral-400 uppercase tracking-wide"
                >
                  {{ formatTranslations(entity.translation_states) }}
                </span>

                <!-- Blocker count -->
                <UBadge
                  v-if="entity.editorial?.blockingReasons?.length"
                  size="xs"
                  color="error"
                  variant="subtle"
                >
                  <UIcon name="i-heroicons-exclamation-triangle" class="size-2.5 mr-0.5" />
                  {{ entity.editorial.blockingReasons.length }}
                </UBadge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Drag feedback toast overlay (invisible, for screen readers) -->
    <div aria-live="polite" class="sr-only">
      {{ dragAnnouncement }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n, useRouter, useToast } from '#imports'
import { useEditorialBoard } from '~/composables/manage/useEditorialBoard'
import type { BoardEntity, EntityTypeFilter } from '~/composables/manage/useEditorialBoard'
import { useCardStatus } from '~/utils/status'
import type { CardStatus } from '~~/shared/editorial/card-status'

definePageMeta({ layout: 'default' })

const { t, te } = useI18n()
const router = useRouter()
const toast = useToast()
const statusUtil = useCardStatus()

function tt(key: string, fallback: string): string {
  return te(key) ? t(key) : fallback
}

const {
  entities,
  columns,
  loading,
  error,
  filters,
  worldOptions,
  transitioning,
  entityEndpoints,
  fetchAll,
  moveEntity,
  canDrop,
} = useEditorialBoard()

// --- Filter options ---
const entityTypeOptions = computed(() => [
  { label: tt('ui.filters.allTypes', 'All types'), value: 'all' as EntityTypeFilter },
  ...entityEndpoints.map(ep => ({ label: ep.label, value: ep.key })),
])

const selectedWorldId = computed({
  get: () => filters.worldId != null ? String(filters.worldId) : '',
  set: (val: string) => {
    filters.worldId = val ? Number(val) : null
  },
})

const worldFilterOptions = computed(() => [
  { label: tt('ui.filters.allWorlds', 'All worlds'), value: '' },
  ...worldOptions.value.map(w => ({ label: w.label, value: String(w.value) })),
])

// --- Status helpers ---
function statusColor(status: string): 'neutral' | 'primary' | 'warning' | 'success' | 'error' {
  return statusUtil.color(status as CardStatus)
}

function statusVariant(status: string): 'subtle' | 'soft' | 'outline' {
  return statusUtil.variant(status as CardStatus)
}

function statusLabelKey(status: string): string {
  return statusUtil.labelKey(status as CardStatus)
}

function entityTypeLabel(type: string): string {
  const ep = entityEndpoints.find(e => e.key === type)
  return ep?.label ?? type
}

function formatTranslations(states: { lang: string; status: string }[]): string {
  return states.map(s => s.lang.toUpperCase()).join(' ')
}

function isTransitioning(entity: BoardEntity): boolean {
  return !!transitioning[`${entity.entity_type}:${entity.id}`]
}

// --- Drag & Drop ---
const draggedEntity = ref<BoardEntity | null>(null)
const dragOverColumn = ref<CardStatus | null>(null)
const dragAnnouncement = ref('')

function onDragStart(event: DragEvent, entity: BoardEntity) {
  draggedEntity.value = entity
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `${entity.entity_type}:${entity.id}`)
  }
  dragAnnouncement.value = `Dragging ${entity.name}`
}

function onDragEnd() {
  draggedEntity.value = null
  dragOverColumn.value = null
  dragAnnouncement.value = ''
}

function onDragOver(event: DragEvent, status: CardStatus) {
  if (!draggedEntity.value) return
  if (canDrop(draggedEntity.value, status)) {
    event.dataTransfer!.dropEffect = 'move'
    dragOverColumn.value = status
  } else {
    event.dataTransfer!.dropEffect = 'none'
  }
}

function onDragLeave(status: CardStatus) {
  if (dragOverColumn.value === status) {
    dragOverColumn.value = null
  }
}

async function onDrop(targetStatus: CardStatus) {
  dragOverColumn.value = null
  const entity = draggedEntity.value
  draggedEntity.value = null

  if (!entity || entity.status === targetStatus) return

  if (!canDrop(entity, targetStatus)) {
    toast.add({
      title: tt('features.editorial.invalidTransition', 'Invalid transition'),
      description: tt('features.editorial.cannotMoveToStatus', 'This status change is not allowed.'),
      color: 'error',
    })
    dragAnnouncement.value = 'Drop cancelled — invalid transition'
    return
  }

  dragAnnouncement.value = `Moving ${entity.name} to ${targetStatus}`

  const success = await moveEntity(entity, targetStatus)
  if (success) {
    toast.add({
      title: tt('features.editorial.transitionSuccess', 'Status updated'),
      description: `${entity.name}: ${entity.status} → ${targetStatus}`,
      color: 'success',
    })
    dragAnnouncement.value = `${entity.name} moved to ${targetStatus}`
  } else {
    toast.add({
      title: tt('features.editorial.transitionFailed', 'Transition failed'),
      description: tt('features.editorial.transitionError', 'The server rejected this status change.'),
      color: 'error',
    })
    dragAnnouncement.value = `Failed to move ${entity.name}`
  }
}

// --- Init ---
onMounted(() => {
  fetchAll()
})
</script>
