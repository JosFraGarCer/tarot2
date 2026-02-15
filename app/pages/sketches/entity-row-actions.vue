<!--
  /pages/sketches/entity-row-actions.vue
  POC 2: Redesigned entity row actions

  OBJECTIVE:
  Replace the current 7-icon action column with prioritized actions:
  - Primary: "Edit" (opens Slideover) — single entry point, no double-click
  - Secondary: "Next transition" (one-click editorial state change)
  - Overflow: delete base, delete translation, tags, feedback

  SUCCESS CRITERIA:
  - "Send entity to review" = 1 click (not 3)
  - No FormModal/Slideover confusion (single Edit action always opens Slideover)
  - Delete always shows explicit preview of what will be removed
  - Keyboard navigable: Tab through actions, Enter to activate

  INTEGRATION INTO /manage:
  1. Replace EntityActions.vue with new SketchRowActions pattern
  2. Wire Edit button to EntitySlideover.vue (emit 'open-slideover' instead of 'edit')
  3. Wire Next Transition to handleEditorialTransition() from EntitySlideover
  4. Wire delete actions to useEntityDeletion composable
  5. Remove double-click handler from EntityBase.vue row click
-->
<script setup lang="ts">
import { ref, computed, h, resolveComponent } from 'vue'
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import {
  generateMockEntities,
  editorialStatusMeta,
  translationCoverage,
  computeEditorial,
  releaseStageDot,
  releaseStageLabel,
  avatarUrl,
  relativeTime,
  EDITORIAL_TRANSITIONS,
  type MockEntity,
  type EditorialStatus,
} from '~/components/sketches/mockData'
import SketchCrossNav from '~/components/sketches/SketchCrossNav.vue'

definePageMeta({ layout: 'default' })

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UAvatar = resolveComponent('UAvatar')

const toast = useToast()

// --- Auth simulation ---
const isAuthenticated = ref(true)

// --- Data ---
const entities = ref(generateMockEntities(10))

// --- Preview modal ---
const previewOpen = ref(false)
const previewEntity = ref<MockEntity | null>(null)
function openPreview(entity: MockEntity) {
  previewEntity.value = entity
  previewOpen.value = true
}

function thumbnailUrl(entity: MockEntity): string {
  return entity.image ?? `https://picsum.photos/seed/${entity.code}${entity.id}/80/112`
}

// --- Slideover state ---
const slideoverOpen = ref(false)
const slideoverEntity = ref<MockEntity | null>(null)
const slideoverIndex = computed(() => {
  if (!slideoverEntity.value) return -1
  return entities.value.findIndex(e => e.id === slideoverEntity.value!.id)
})
const hasPrev = computed(() => slideoverIndex.value > 0)
const hasNext = computed(() => slideoverIndex.value >= 0 && slideoverIndex.value < entities.value.length - 1)

function openEditor(entity: MockEntity) {
  slideoverEntity.value = entity
  slideoverOpen.value = true
}
function navPrev() {
  if (hasPrev.value) slideoverEntity.value = entities.value[slideoverIndex.value - 1]
}
function navNext() {
  if (hasNext.value) slideoverEntity.value = entities.value[slideoverIndex.value + 1]
}

// --- Delete modal state ---
const deleteModalOpen = ref(false)
const deleteTarget = ref<{ entity: MockEntity; mode: 'base' | 'translation'; lang?: string } | null>(null)

function openDeleteDialog(entity: MockEntity, mode: 'base' | 'translation', lang?: string) {
  deleteTarget.value = { entity, mode, lang }
  deleteModalOpen.value = true
}

function confirmDelete() {
  if (!deleteTarget.value) return
  const { entity, mode, lang } = deleteTarget.value
  if (mode === 'base') {
    entities.value = entities.value.filter(e => e.id !== entity.id)
    toast.add({ title: `Deleted entity "${entity.name}"`, color: 'success', icon: 'i-lucide-check' })
  } else {
    const idx = entities.value.findIndex(e => e.id === entity.id)
    if (idx !== -1) {
      const updated = { ...entities.value[idx] }
      updated.translations = updated.translations.map(t =>
        t.lang === lang ? { ...t, has_translation: false, is_fallback: true } : t
      )
      updated.editorial = computeEditorial(updated.status, updated.translations)
      entities.value[idx] = updated
    }
    toast.add({ title: `Deleted ${lang?.toUpperCase()} translation for "${entity.name}"`, color: 'success', icon: 'i-lucide-check' })
  }
  deleteModalOpen.value = false
  deleteTarget.value = null
}

// --- Editorial transition ---
function executeTransition(entity: MockEntity, nextStatus: EditorialStatus) {
  const idx = entities.value.findIndex(e => e.id === entity.id)
  if (idx === -1) return
  const updated = { ...entities.value[idx] }
  updated.status = nextStatus
  updated.editorial_state = {
    status: nextStatus,
    updated_by: 'current_user',
    updated_at: new Date().toISOString(),
  }
  updated.editorial = computeEditorial(nextStatus, updated.translations)
  entities.value[idx] = updated

  const meta = editorialStatusMeta(nextStatus)
  toast.add({
    title: `"${entity.name}" → ${meta.label}`,
    color: 'success',
    icon: 'i-lucide-check',
  })

  if (slideoverEntity.value?.id === entity.id) {
    slideoverEntity.value = updated
  }
}

function nextTransitionFor(entity: MockEntity): { status: EditorialStatus; label: string; icon: string } | null {
  const transitions = EDITORIAL_TRANSITIONS[entity.status] ?? []
  if (!transitions.length) return null
  const next = transitions[0]
  const meta = editorialStatusMeta(next)
  return { status: next, label: meta.label, icon: meta.icon }
}

// --- Overflow menu items ---
function overflowItems(entity: MockEntity): DropdownMenuItem[][] {
  const nonEnTranslations = entity.translations.filter(t => t.lang !== 'en' && t.has_translation && !t.is_fallback)

  const deleteGroup: DropdownMenuItem[] = [
    {
      label: 'Delete entity',
      icon: 'i-lucide-trash-2',
      color: 'error' as const,
      onSelect: () => openDeleteDialog(entity, 'base'),
    },
  ]

  if (nonEnTranslations.length) {
    for (const t of nonEnTranslations) {
      deleteGroup.push({
        label: `Delete ${t.lang.toUpperCase()} translation`,
        icon: 'i-lucide-languages',
        onSelect: () => openDeleteDialog(entity, 'translation', t.lang),
      })
    }
  }

  const actionsGroup: DropdownMenuItem[] = [
    {
      label: 'Manage tags',
      icon: 'i-lucide-tags',
      onSelect: () => toast.add({ title: `Tags for "${entity.name}"`, icon: 'i-lucide-tags' }),
    },
    {
      label: 'Feedback',
      icon: 'i-lucide-message-square',
      onSelect: () => toast.add({ title: `Feedback for "${entity.name}"`, icon: 'i-lucide-message-square' }),
    },
  ]

  return [actionsGroup, deleteGroup]
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
              ? h(UBadge, { color: 'primary', variant: 'subtle', size: 'xs' }, () => e.world!.name)
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
    id: 'translations',
    header: 'Langs',
    cell: ({ row }) => {
      const cov = translationCoverage(row.original.translations)
      const color = cov.done === cov.total ? 'success' : cov.done === 0 ? 'error' : 'warning'
      return h(UBadge, {
        color,
        variant: 'soft',
        size: 'xs',
        'aria-label': `${cov.label} translations. ${cov.missing.length ? 'Missing: ' + cov.missing.join(', ') : 'All complete'}`,
      }, () => cov.label)
    },
  },
  {
    id: 'updated',
    header: 'Updated',
    cell: ({ row }) => {
      const e = row.original
      return h('div', { class: 'flex items-center gap-1.5' }, [
        h(UAvatar, { src: avatarUrl(e.updated_by), alt: e.updated_by, size: 'xs' }),
        h('span', { class: 'text-[10px] text-muted tabular-nums' }, relativeTime(e.modified_at)),
      ])
    },
  },
  {
    id: 'actions',
    header: '',
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const entity = row.original
      const next = nextTransitionFor(entity)

      const children = [
        // Preview
        h(UButton, {
          icon: 'i-lucide-eye',
          size: 'xs',
          variant: 'ghost',
          color: 'neutral',
          'aria-label': `Preview ${entity.name}`,
          onClick: () => openPreview(entity),
        }),
        // Primary: Edit (always visible)
        h(UButton, {
          label: 'Edit',
          icon: 'i-lucide-pencil',
          size: 'xs',
          variant: 'soft',
          color: 'primary',
          'aria-label': `Edit ${entity.name}`,
          onClick: () => openEditor(entity),
        }),
      ]

      // Secondary: Next transition (if available)
      if (next) {
        children.push(
          h(UButton, {
            label: next.label,
            icon: 'i-lucide-arrow-right',
            size: 'xs',
            variant: 'ghost',
            color: 'neutral',
            'aria-label': `Transition ${entity.name} to ${next.label}`,
            onClick: () => executeTransition(entity, next.status),
          })
        )
      }

      // Overflow menu
      children.push(
        h(UDropdownMenu, {
          items: overflowItems(entity),
          content: { align: 'end' },
          'aria-label': `More actions for ${entity.name}`,
        }, () => h(UButton, {
          icon: 'i-lucide-ellipsis-vertical',
          size: 'xs',
          variant: 'ghost',
          color: 'neutral',
          'aria-label': `More actions for ${entity.name}`,
        }))
      )

      return h('div', { class: 'flex items-center justify-end gap-1' }, children)
    },
  },
]
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
          <h1 class="text-lg font-bold tracking-tight">Entity Row Actions</h1>
          <UBadge color="error" variant="subtle" size="xs">POC</UBadge>
        </div>
        <div class="flex items-center gap-1.5">
          <USwitch v-model="isAuthenticated" size="xs" color="primary" aria-label="Toggle authentication" />
          <span class="text-[10px]" :class="isAuthenticated ? 'text-primary' : 'text-muted'">{{ isAuthenticated ? 'Auth' : 'Guest' }}</span>
        </div>
      </div>
    </header>

    <SketchCrossNav current-view="" />

    <!-- 401 state -->
    <div v-if="!isAuthenticated" class="flex-1 flex items-center justify-center">
      <div class="text-center p-12">
        <UIcon name="i-lucide-shield-alert" class="text-4xl text-error mb-3" />
        <h2 class="text-lg font-semibold mb-1">401 Not Authenticated</h2>
        <p class="text-sm text-muted mb-4">Editorial actions require authentication.</p>
        <UButton label="Simulate Login" icon="i-lucide-log-in" @click="isAuthenticated = true" />
      </div>
    </div>

    <!-- Authenticated view -->
    <template v-else>
      <div class="max-w-7xl mx-auto px-4 py-6 w-full flex-1">
        <!-- Action pattern legend -->
        <div class="flex items-center gap-4 mb-4 p-3 rounded-lg bg-muted/30 border border-default text-xs text-muted">
          <span class="flex items-center gap-1"><UIcon name="i-lucide-eye" /> <strong>Preview</strong></span>
          <span class="flex items-center gap-1"><UIcon name="i-lucide-pencil" class="text-primary" /> <strong>Edit</strong> = Slideover</span>
          <span class="flex items-center gap-1"><UIcon name="i-lucide-arrow-right" /> <strong>Next</strong> = Transition</span>
          <span class="flex items-center gap-1"><UIcon name="i-lucide-ellipsis-vertical" /> <strong>More</strong></span>
        </div>

        <!-- Table -->
        <div class="rounded-lg border border-default">
          <UTable
            :data="entities"
            :columns="columns"
            class="w-full"
            :ui="{
              th: 'text-xs font-medium text-muted uppercase tracking-wider',
              td: 'py-2',
            }"
          />
        </div>
      </div>
    </template>

    <!-- Preview modal -->
    <UModal v-model:open="previewOpen" role="dialog" aria-modal="true">
      <template #header>
        <span class="text-sm font-bold">{{ previewEntity?.name }}</span>
      </template>
      <template #body>
        <div v-if="previewEntity" class="flex gap-4">
          <img :src="thumbnailUrl(previewEntity)" :alt="previewEntity.name" class="w-32 h-44 rounded-lg object-cover shrink-0 bg-muted/20">
          <div class="space-y-2 flex-1">
            <div class="flex items-center gap-2">
              <UBadge :color="editorialStatusMeta(previewEntity.status).color" :variant="editorialStatusMeta(previewEntity.status).variant" :icon="editorialStatusMeta(previewEntity.status).icon" size="xs">{{ editorialStatusMeta(previewEntity.status).label }}</UBadge>
              <UBadge v-if="previewEntity.version_semver" color="neutral" variant="outline" size="xs">v{{ previewEntity.version_semver }}</UBadge>
            </div>
            <div class="flex items-center gap-1.5">
              <UBadge color="neutral" variant="outline" size="xs">{{ previewEntity.entity_type }}</UBadge>
              <UBadge v-if="previewEntity.world" color="primary" variant="subtle" size="xs" icon="i-lucide-globe">{{ previewEntity.world.name }}</UBadge>
              <UBadge v-else color="neutral" variant="subtle" size="xs">Base System</UBadge>
            </div>
            <div class="text-xs text-muted space-y-1 pt-2">
              <div class="flex items-center gap-1.5">
                <UAvatar :src="avatarUrl(previewEntity.created_by)" :alt="previewEntity.created_by" size="2xs" />
                <span>Created by <strong>{{ previewEntity.created_by }}</strong> · {{ relativeTime(previewEntity.created_at) }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <UAvatar :src="avatarUrl(previewEntity.updated_by)" :alt="previewEntity.updated_by" size="2xs" />
                <span>Updated by <strong>{{ previewEntity.updated_by }}</strong> · {{ relativeTime(previewEntity.modified_at) }}</span>
              </div>
            </div>
            <div v-if="(previewEntity.editorial?.blockingReasons.length ?? 0) > 0" class="p-2 rounded bg-warning/10 border border-warning/20 mt-2">
              <p class="text-[10px] font-medium text-warning">{{ previewEntity.editorial!.blockingReasons.length }} blockers</p>
              <ul class="text-[10px] text-muted list-disc list-inside">
                <li v-for="r in previewEntity.editorial!.blockingReasons" :key="r">{{ r }}</li>
              </ul>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-between">
          <UButton label="Open in Studio" icon="i-lucide-palette" size="xs" variant="soft" @click="previewOpen = false; if (previewEntity) openEditor(previewEntity)" />
          <UButton label="Close" color="neutral" variant="outline" size="xs" @click="previewOpen = false" />
        </div>
      </template>
    </UModal>

    <!-- Slideover (editor simulation) -->
    <USlideover
      v-model:open="slideoverOpen"
      :title="slideoverEntity?.name ?? 'Entity Editor'"
      :description="`#${slideoverEntity?.code ?? ''} — ${slideoverEntity?.entity_type ?? ''}`"
      side="right"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm">{{ slideoverEntity?.name }}</span>
            <UBadge v-if="slideoverEntity?.world" color="primary" variant="subtle" size="xs" icon="i-lucide-globe">{{ slideoverEntity.world.name }}</UBadge>
            <UBadge v-else-if="slideoverEntity" color="neutral" variant="subtle" size="xs">Base System</UBadge>
          </div>
          <div class="flex items-center gap-1">
            <UButton icon="i-lucide-chevron-left" size="xs" variant="ghost" color="neutral" :disabled="!hasPrev" aria-label="Previous entity" @click="navPrev" />
            <span class="text-[10px] text-muted tabular-nums">{{ slideoverIndex + 1 }}/{{ entities.length }}</span>
            <UButton icon="i-lucide-chevron-right" size="xs" variant="ghost" color="neutral" :disabled="!hasNext" aria-label="Next entity" @click="navNext" />
          </div>
        </div>
      </template>

      <template #body>
        <div v-if="slideoverEntity" class="space-y-6">
          <!-- Status section -->
          <div>
            <h3 class="text-xs font-medium text-muted uppercase tracking-wider mb-2">Editorial Status</h3>
            <div class="flex items-center gap-2">
              <UBadge
                :color="editorialStatusMeta(slideoverEntity.status).color"
                :variant="editorialStatusMeta(slideoverEntity.status).variant"
                :icon="editorialStatusMeta(slideoverEntity.status).icon"
              >
                {{ editorialStatusMeta(slideoverEntity.status).label }}
              </UBadge>
              <UBadge v-if="slideoverEntity.version_semver" color="neutral" variant="outline" size="xs">v{{ slideoverEntity.version_semver }}</UBadge>
              <span v-if="slideoverEntity.release_stage" :class="`inline-block w-2 h-2 rounded-full ${releaseStageDot(slideoverEntity.release_stage)}`" :title="releaseStageLabel(slideoverEntity.release_stage)" />
            </div>

            <!-- Blocking reasons -->
            <div
              v-if="slideoverEntity.editorial && !slideoverEntity.editorial.publishReady && slideoverEntity.editorial.blockingReasons.length"
              class="mt-2 p-2 rounded bg-warning/10 border border-warning/20"
              role="alert"
            >
              <p class="text-xs font-medium text-warning mb-1">Publish blocked:</p>
              <ul class="text-xs text-muted list-disc list-inside">
                <li v-for="reason in slideoverEntity.editorial.blockingReasons" :key="reason">{{ reason }}</li>
              </ul>
            </div>

            <!-- Transition buttons -->
            <div v-if="slideoverEntity.editorial?.allowedTransitions.length" class="flex flex-wrap gap-2 mt-3">
              <UButton
                v-for="transition in slideoverEntity.editorial.allowedTransitions"
                :key="transition"
                :label="editorialStatusMeta(transition).label"
                :icon="editorialStatusMeta(transition).icon"
                size="xs"
                variant="outline"
                @click="executeTransition(slideoverEntity!, transition as EditorialStatus)"
              />
            </div>
          </div>

          <!-- Translations section with edit dropdown -->
          <div>
            <h3 class="text-xs font-medium text-muted uppercase tracking-wider mb-2">Translations</h3>
            <div class="space-y-2">
              <div
                v-for="t in slideoverEntity.translations"
                :key="t.lang"
                class="flex items-center justify-between p-2 rounded border border-default"
              >
                <div class="flex items-center gap-2">
                  <UBadge color="neutral" variant="outline" size="xs">{{ t.lang.toUpperCase() }}</UBadge>
                  <span class="text-xs">{{ t.has_translation && !t.is_fallback ? 'Complete' : 'Missing / Fallback' }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <UBadge
                    :color="t.has_translation && !t.is_fallback ? 'success' : 'warning'"
                    variant="soft"
                    size="xs"
                  >
                    {{ t.has_translation && !t.is_fallback ? 'OK' : 'Needed' }}
                  </UBadge>
                  <UButton
                    v-if="t.lang !== 'en'"
                    icon="i-lucide-pencil"
                    size="xs"
                    variant="ghost"
                    color="neutral"
                    :aria-label="`Edit ${t.lang.toUpperCase()} translation`"
                    @click="toast.add({ title: `Edit ${t.lang.toUpperCase()} translation`, icon: 'i-lucide-languages' })"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Creator / updater info -->
          <div>
            <h3 class="text-xs font-medium text-muted uppercase tracking-wider mb-2">People</h3>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <UAvatar :src="avatarUrl(slideoverEntity.created_by)" :alt="slideoverEntity.created_by" size="xs" />
                <div>
                  <span class="text-xs font-medium">{{ slideoverEntity.created_by }}</span>
                  <span class="text-[10px] text-muted ml-1">created {{ relativeTime(slideoverEntity.created_at) }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UAvatar :src="avatarUrl(slideoverEntity.updated_by)" :alt="slideoverEntity.updated_by" size="xs" />
                <div>
                  <span class="text-xs font-medium">{{ slideoverEntity.updated_by }}</span>
                  <span class="text-[10px] text-muted ml-1">updated {{ relativeTime(slideoverEntity.modified_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Basic fields -->
          <div>
            <h3 class="text-xs font-medium text-muted uppercase tracking-wider mb-2">Details</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-muted">Code</span><span class="font-mono text-xs">{{ slideoverEntity.code }}</span></div>
              <div class="flex justify-between"><span class="text-muted">Type</span><span>{{ slideoverEntity.entity_type }}</span></div>
              <div class="flex justify-between"><span class="text-muted">Active</span><UBadge :color="slideoverEntity.is_active ? 'success' : 'neutral'" variant="soft" size="xs">{{ slideoverEntity.is_active ? 'Yes' : 'No' }}</UBadge></div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="Close" color="neutral" variant="outline" @click="slideoverOpen = false" />
        </div>
      </template>
    </USlideover>

    <!-- Delete confirmation modal -->
    <UModal
      v-model:open="deleteModalOpen"
      :title="deleteTarget?.mode === 'base' ? 'Delete Entity' : 'Delete Translation'"
      role="dialog"
      aria-modal="true"
    >
      <template #body>
        <div v-if="deleteTarget" class="space-y-4">
          <!-- Impact preview -->
          <div class="p-3 rounded-lg border border-default bg-muted/20">
            <p class="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              What will be deleted:
            </p>

            <template v-if="deleteTarget.mode === 'base'">
              <div class="space-y-1.5">
                <div class="flex items-center gap-2 text-sm">
                  <UIcon name="i-lucide-box" class="text-error shrink-0" />
                  <span>Base entity: <strong>{{ deleteTarget.entity.name }}</strong> (#{{ deleteTarget.entity.code }})</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <UIcon name="i-lucide-languages" class="text-error shrink-0" />
                  <span>All translations ({{ deleteTarget.entity.translations.filter(t => t.has_translation).length }} languages)</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <UIcon name="i-lucide-file-check" class="text-error shrink-0" />
                  <span>Editorial state &amp; history</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <UIcon name="i-lucide-tags" class="text-error shrink-0" />
                  <span>{{ deleteTarget.entity.tags.length }} tag associations</span>
                </div>
              </div>
              <div class="mt-3 p-2 rounded bg-error/10 border border-error/20" role="alert">
                <p class="text-xs text-error font-medium">
                  This action is irreversible. The entity and all related data will be permanently removed.
                </p>
              </div>
            </template>

            <template v-else>
              <div class="space-y-1.5">
                <div class="flex items-center gap-2 text-sm">
                  <UIcon name="i-lucide-languages" class="text-warning shrink-0" />
                  <span>{{ deleteTarget.lang?.toUpperCase() }} translation for <strong>{{ deleteTarget.entity.name }}</strong></span>
                </div>
              </div>
              <div class="mt-3 p-2 rounded bg-muted/30 border border-default">
                <p class="text-xs text-muted">
                  The base entity and other translations will not be affected.
                  The {{ deleteTarget.lang?.toUpperCase() }} field will fall back to English.
                </p>
              </div>
            </template>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            @click="deleteModalOpen = false"
          />
          <UButton
            :label="deleteTarget?.mode === 'base' ? 'Delete Entity' : 'Delete Translation'"
            :color="deleteTarget?.mode === 'base' ? 'error' : 'warning'"
            icon="i-lucide-trash-2"
            @click="confirmDelete"
          />
        </div>
      </template>
    </UModal>

    <!-- Integration notes -->
    <div class="mt-6 p-4 rounded-lg bg-muted/30 border border-default">
      <p class="text-xs text-muted leading-relaxed">
        <strong>Integration:</strong> Replace <code class="text-xs">EntityActions.vue</code> with this pattern.
        Wire Edit to <code class="text-xs">EntitySlideover</code> (not FormModal).
        Wire transitions to <code class="text-xs">handleEditorialTransition()</code>.
        Wire delete to <code class="text-xs">useEntityDeletion</code>.
        Remove double-click handler from <code class="text-xs">EntityBase.vue</code>.
      </p>
    </div>
  </div>
</template>
