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
import { ref, h, resolveComponent } from 'vue'
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import {
  generateMockEntities,
  editorialStatusMeta,
  translationCoverage,
  computeEditorial,
  EDITORIAL_TRANSITIONS,
  type MockEntity,
  type EditorialStatus,
} from '~/components/sketches/mockData'

definePageMeta({ layout: 'default' })

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()

// --- Auth simulation ---
const isAuthenticated = ref(true)

// --- Data ---
const entities = ref(generateMockEntities(10))

// --- Slideover state ---
const slideoverOpen = ref(false)
const slideoverEntity = ref<MockEntity | null>(null)

function openEditor(entity: MockEntity) {
  slideoverEntity.value = entity
  slideoverOpen.value = true
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
    header: 'Name',
    cell: ({ row }) => {
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium text-sm' }, row.original.name),
        h('span', { class: 'text-xs text-muted' }, `#${row.original.code}`),
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
    id: 'actions',
    header: '',
    meta: { class: { td: 'text-right' } },
    cell: ({ row }) => {
      const entity = row.original
      const next = nextTransitionFor(entity)

      const children = [
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
  <div class="max-w-6xl mx-auto px-4 py-8">
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
            Entity Row Actions
          </h1>
          <UBadge color="error" variant="subtle" size="xs">
            POC
          </UBadge>
        </div>
        <p class="text-xs text-muted mt-1 ml-6">
          Prioritized actions: Edit (Slideover) + Next Transition + Overflow menu. No double-click.
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
        Editorial actions require authentication.
      </p>
      <UButton
        label="Simulate Login"
        icon="i-lucide-log-in"
        @click="isAuthenticated = true"
      />
    </div>

    <!-- Authenticated view -->
    <template v-else>
      <!-- Action pattern legend -->
      <div class="flex items-center gap-4 mb-4 p-3 rounded-lg bg-muted/30 border border-default text-xs text-muted">
        <span class="flex items-center gap-1">
          <UIcon name="i-lucide-pencil" class="text-primary" />
          <strong>Edit</strong> = Opens Slideover (single entry point)
        </span>
        <span class="flex items-center gap-1">
          <UIcon name="i-lucide-arrow-right" />
          <strong>Next</strong> = One-click editorial transition
        </span>
        <span class="flex items-center gap-1">
          <UIcon name="i-lucide-ellipsis-vertical" />
          <strong>More</strong> = Delete, tags, feedback
        </span>
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
    </template>

    <!-- Slideover (editor simulation) -->
    <USlideover
      v-model:open="slideoverOpen"
      :title="slideoverEntity?.name ?? 'Entity Editor'"
      :description="`#${slideoverEntity?.code ?? ''} — ${slideoverEntity?.entity_type ?? ''}`"
      side="right"
    >
      <template #body>
        <div v-if="slideoverEntity" class="space-y-6">
          <!-- Status section -->
          <div>
            <h3 class="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Editorial Status
            </h3>
            <div class="flex items-center gap-2">
              <UBadge
                :color="editorialStatusMeta(slideoverEntity.status).color"
                :variant="editorialStatusMeta(slideoverEntity.status).variant"
                :icon="editorialStatusMeta(slideoverEntity.status).icon"
                :aria-label="`Current status: ${editorialStatusMeta(slideoverEntity.status).label}`"
              >
                {{ editorialStatusMeta(slideoverEntity.status).label }}
              </UBadge>
            </div>

            <!-- Blocking reasons -->
            <div
              v-if="slideoverEntity.editorial && !slideoverEntity.editorial.publishReady && slideoverEntity.editorial.blockingReasons.length"
              class="mt-2 p-2 rounded bg-warning/10 border border-warning/20"
              role="alert"
            >
              <p class="text-xs font-medium text-warning mb-1">
                Publish blocked:
              </p>
              <ul class="text-xs text-muted list-disc list-inside">
                <li v-for="reason in slideoverEntity.editorial.blockingReasons" :key="reason">
                  {{ reason }}
                </li>
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
                :aria-label="`Transition to ${editorialStatusMeta(transition).label}`"
                @click="executeTransition(slideoverEntity!, transition as EditorialStatus)"
              />
            </div>
          </div>

          <!-- Translations section -->
          <div>
            <h3 class="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Translations
            </h3>
            <div class="space-y-2">
              <div
                v-for="t in slideoverEntity.translations"
                :key="t.lang"
                class="flex items-center justify-between p-2 rounded border border-default"
              >
                <div class="flex items-center gap-2">
                  <UBadge color="neutral" variant="outline" size="xs">
                    {{ t.lang.toUpperCase() }}
                  </UBadge>
                  <span class="text-sm">
                    {{ t.has_translation && !t.is_fallback ? 'Complete' : 'Missing / Fallback' }}
                  </span>
                </div>
                <UBadge
                  :color="t.has_translation && !t.is_fallback ? 'success' : 'warning'"
                  variant="soft"
                  size="xs"
                  :aria-label="`${t.lang.toUpperCase()} translation: ${t.has_translation && !t.is_fallback ? 'complete' : 'missing'}`"
                >
                  {{ t.has_translation && !t.is_fallback ? 'OK' : 'Needed' }}
                </UBadge>
              </div>
            </div>
          </div>

          <!-- Basic fields (placeholder) -->
          <div>
            <h3 class="text-xs font-medium text-muted uppercase tracking-wider mb-2">
              Basic Fields
            </h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Code</span>
                <span class="font-mono">{{ slideoverEntity.code }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Type</span>
                <span>{{ slideoverEntity.entity_type }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Updated by</span>
                <span>{{ slideoverEntity.updated_by }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Modified</span>
                <span class="tabular-nums">{{ new Date(slideoverEntity.modified_at).toLocaleDateString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            label="Close"
            color="neutral"
            variant="outline"
            @click="slideoverOpen = false"
          />
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
