<!--
  /pages/sketches/diff-compare.vue
  POC: Diff / Compare View — prev_snapshot vs next_snapshot

  OBJECTIVE:
  Side-by-side comparison of two content revision snapshots.
  Shows field-level diffs with additions/removals highlighted.
  Supports language selection for translation diffs.

  SUCCESS CRITERIA:
  - Clear side-by-side layout (before / after)
  - Field-level diff highlighting (added, removed, changed)
  - Version selector for both sides
  - Language selector for translation comparison
  - Accessible with proper ARIA labels

  INTEGRATION INTO /manage:
  1. Route: /manage/:entity/:id/diff?from=X&to=Y
  2. Data from /api/content-revisions/:id/snapshot
  3. Linked from Timeline View "View diff" buttons
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  generateMockEntities,
  editorialStatusMeta,
} from '~/components/sketches/mockData'

definePageMeta({ layout: 'default' })

// --- Entity context ---
const allEntities = generateMockEntities(10)
const entity = allEntities[0]!

// --- Mock snapshots ---
interface FieldSnapshot {
  field: string
  value: string
}

interface ContentSnapshot {
  id: number
  version: number
  lang: string
  created_at: string
  created_by: string
  fields: FieldSnapshot[]
}

const snapshots: ContentSnapshot[] = [
  {
    id: 101, version: 1, lang: 'en', created_at: '2026-02-12T08:05:00Z', created_by: 'alice',
    fields: [
      { field: 'title', value: 'The Fool' },
      { field: 'subtitle', value: 'Arcana 0' },
      { field: 'description', value: 'The Fool represents new beginnings and having faith in the future.' },
      { field: 'keywords', value: 'beginnings, faith' },
    ],
  },
  {
    id: 102, version: 2, lang: 'en', created_at: '2026-02-12T14:00:00Z', created_by: 'alice',
    fields: [
      { field: 'title', value: 'The Fool' },
      { field: 'subtitle', value: 'Major Arcana · 0' },
      { field: 'description', value: 'The Fool represents new beginnings, having faith in the future, being inexperienced, not knowing what to expect, having beginner\'s luck, improvisation and believing in the universe.' },
      { field: 'keywords', value: 'beginnings, faith, journey, innocence' },
    ],
  },
  {
    id: 103, version: 3, lang: 'en', created_at: '2026-02-13T11:00:00Z', created_by: 'alice',
    fields: [
      { field: 'title', value: 'The Fool' },
      { field: 'subtitle', value: 'Major Arcana · 0' },
      { field: 'description', value: 'The Fool stands at the edge of a cliff, gazing upward at the sky. A small dog barks at their heels. The number 0 marks the beginning and the end — the eternal cycle of the journey. The Fool represents new beginnings, having faith in the future, being inexperienced, and believing in the universe.' },
      { field: 'keywords', value: 'beginnings, faith, journey, innocence, cliff, dog' },
    ],
  },
  {
    id: 201, version: 1, lang: 'fr', created_at: '2026-02-12T10:30:00Z', created_by: 'bob',
    fields: [
      { field: 'title', value: 'Le Mat' },
      { field: 'subtitle', value: 'Arcane Majeur · 0' },
      { field: 'description', value: 'Le Mat représente les nouveaux départs et la foi en l\'avenir.' },
      { field: 'keywords', value: 'débuts, foi' },
    ],
  },
  {
    id: 202, version: 2, lang: 'fr', created_at: '2026-02-13T09:30:00Z', created_by: 'bob',
    fields: [
      { field: 'title', value: 'Le Mat' },
      { field: 'subtitle', value: 'Arcane Majeur · 0' },
      { field: 'description', value: 'Le Mat se tient au bord d\'une falaise, le regard tourné vers le ciel. Un petit chien aboie à ses talons. Le Mat représente les nouveaux départs, la foi en l\'avenir, l\'inexpérience et la confiance dans l\'univers.' },
      { field: 'keywords', value: 'débuts, foi, voyage, innocence' },
    ],
  },
]

// --- Language selection ---
const selectedLang = ref('en')
const langOptions = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
]

// --- Version selection ---
const langSnapshots = computed(() => snapshots.filter(s => s.lang === selectedLang.value).sort((a, b) => a.version - b.version))
const versionOptions = computed(() => langSnapshots.value.map(s => ({ label: `v${s.version} — ${s.created_by} · ${new Date(s.created_at).toLocaleDateString()}`, value: s.id })))

const leftSnapshotId = ref(langSnapshots.value.length >= 2 ? langSnapshots.value[langSnapshots.value.length - 2]!.id : langSnapshots.value[0]?.id ?? 0)
const rightSnapshotId = ref(langSnapshots.value[langSnapshots.value.length - 1]?.id ?? 0)

const leftSnapshot = computed(() => snapshots.find(s => s.id === leftSnapshotId.value))
const rightSnapshot = computed(() => snapshots.find(s => s.id === rightSnapshotId.value))

// --- Diff computation ---
interface FieldDiff {
  field: string
  left: string | null
  right: string | null
  status: 'unchanged' | 'added' | 'removed' | 'changed'
}

const fieldDiffs = computed<FieldDiff[]>(() => {
  const left = leftSnapshot.value
  const right = rightSnapshot.value
  if (!left || !right) return []

  const allFields = new Set([...left.fields.map(f => f.field), ...right.fields.map(f => f.field)])
  const diffs: FieldDiff[] = []

  for (const field of allFields) {
    const lf = left.fields.find(f => f.field === field)
    const rf = right.fields.find(f => f.field === field)
    const leftVal = lf?.value ?? null
    const rightVal = rf?.value ?? null

    let status: FieldDiff['status'] = 'unchanged'
    if (!leftVal && rightVal) status = 'added'
    else if (leftVal && !rightVal) status = 'removed'
    else if (leftVal !== rightVal) status = 'changed'

    diffs.push({ field, left: leftVal, right: rightVal, status })
  }
  return diffs
})

const changedCount = computed(() => fieldDiffs.value.filter(d => d.status !== 'unchanged').length)

function diffStatusColor(status: FieldDiff['status']): string {
  if (status === 'added') return 'text-emerald-400'
  if (status === 'removed') return 'text-red-400'
  if (status === 'changed') return 'text-amber-400'
  return 'text-muted'
}

function diffStatusBg(status: FieldDiff['status']): string {
  if (status === 'added') return 'bg-emerald-500/5 border-emerald-500/20'
  if (status === 'removed') return 'bg-red-500/5 border-red-500/20'
  if (status === 'changed') return 'bg-amber-500/5 border-amber-500/20'
  return 'bg-transparent border-default'
}

function diffStatusIcon(status: FieldDiff['status']): string {
  if (status === 'added') return 'i-lucide-plus-circle'
  if (status === 'removed') return 'i-lucide-minus-circle'
  if (status === 'changed') return 'i-lucide-pencil'
  return 'i-lucide-equal'
}
</script>

<template>
  <div class="min-h-screen bg-default flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-30 border-b border-default bg-default/95 backdrop-blur-sm">
      <div class="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
        <div class="flex items-center gap-3">
          <NuxtLink to="/sketches" class="text-muted hover:text-primary transition-colors" aria-label="Back to sketches">
            <UIcon name="i-lucide-arrow-left" />
          </NuxtLink>
          <h1 class="text-lg font-bold tracking-tight">Diff / Compare</h1>
          <UBadge color="primary" variant="subtle" size="xs">Phase 3</UBadge>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-xs font-medium">{{ entity.name }}</span>
          <UBadge
            :color="editorialStatusMeta(entity.status).color"
            :variant="editorialStatusMeta(entity.status).variant"
            size="xs"
          >
            {{ editorialStatusMeta(entity.status).label }}
          </UBadge>
          <USelect
            v-model="selectedLang"
            :items="langOptions"
            size="xs"
            class="w-28"
            aria-label="Select language"
          />
        </div>
      </div>
    </header>

    <main class="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
      <!-- Version selectors -->
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs text-muted font-medium">Before (left)</label>
          <USelect
            v-model="leftSnapshotId"
            :items="versionOptions"
            size="sm"
            class="w-full"
            aria-label="Select left version"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs text-muted font-medium">After (right)</label>
          <USelect
            v-model="rightSnapshotId"
            :items="versionOptions"
            size="sm"
            class="w-full"
            aria-label="Select right version"
          />
        </div>
      </div>

      <!-- Diff summary -->
      <div class="flex items-center gap-3">
        <UBadge color="neutral" variant="outline" size="xs">
          {{ fieldDiffs.length }} fields
        </UBadge>
        <UBadge v-if="changedCount > 0" color="warning" variant="soft" size="xs">
          {{ changedCount }} changed
        </UBadge>
        <UBadge v-else color="success" variant="soft" size="xs">
          No changes
        </UBadge>
      </div>

      <!-- Field diffs -->
      <div class="space-y-4">
        <div
          v-for="diff in fieldDiffs"
          :key="diff.field"
          class="rounded-lg border p-4 space-y-3"
          :class="diffStatusBg(diff.status)"
        >
          <!-- Field header -->
          <div class="flex items-center gap-2">
            <UIcon :name="diffStatusIcon(diff.status)" :class="diffStatusColor(diff.status)" class="text-sm" />
            <span class="text-xs font-semibold uppercase tracking-wider" :class="diffStatusColor(diff.status)">{{ diff.field }}</span>
            <UBadge
              v-if="diff.status !== 'unchanged'"
              :color="diff.status === 'added' ? 'success' : diff.status === 'removed' ? 'error' : 'warning'"
              variant="soft"
              size="xs"
            >
              {{ diff.status }}
            </UBadge>
          </div>

          <!-- Side-by-side content -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Left (before) -->
            <div class="rounded-md border border-default p-3 min-h-12">
              <p v-if="diff.left" class="text-xs leading-relaxed" :class="diff.status === 'removed' ? 'text-red-300 line-through' : diff.status === 'changed' ? 'text-muted' : ''">
                {{ diff.left }}
              </p>
              <p v-else class="text-xs text-muted/40 italic">— empty —</p>
            </div>

            <!-- Right (after) -->
            <div class="rounded-md border border-default p-3 min-h-12">
              <p v-if="diff.right" class="text-xs leading-relaxed" :class="diff.status === 'added' ? 'text-emerald-300' : diff.status === 'changed' ? 'text-default' : ''">
                {{ diff.right }}
              </p>
              <p v-else class="text-xs text-muted/40 italic">— empty —</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!leftSnapshot || !rightSnapshot" class="text-center py-16">
        <UIcon name="i-lucide-diff" class="text-4xl text-muted/30 mb-3" />
        <p class="text-sm text-muted">Select two versions to compare.</p>
      </div>
    </main>

    <!-- Integration notes -->
    <div class="border-t border-default p-4 bg-muted/10">
      <p class="text-xs text-muted text-center max-w-3xl mx-auto leading-relaxed">
        <strong>Integration:</strong> Snapshots from <code class="text-xs">/api/content-revisions/:id/snapshot</code>.
        Route: <code class="text-xs">/manage/:entity/:id/diff?from=X&to=Y</code>.
        Linked from Timeline View. Per-language comparison via lang selector.
      </p>
    </div>
  </div>
</template>
