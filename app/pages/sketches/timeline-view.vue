<!--
  /pages/sketches/timeline-view.vue
  POC: Timeline View — editorial_audit_log + content_revisions history

  OBJECTIVE:
  Chronological timeline of all editorial events for an entity:
  status transitions, content revisions, translation updates, feedback events.
  Filterable by event type. Shows who did what and when.

  SUCCESS CRITERIA:
  - Clear chronological timeline with visual event types
  - Filter by event type (transition, revision, translation, feedback)
  - Each event shows actor, timestamp, details
  - Content revision entries show version diff link
  - Accessible and keyboard navigable

  INTEGRATION INTO /manage:
  1. Tab in EntitySlideover or standalone route /manage/:entity/:id/timeline
  2. Data from /api/editorial/audit-log and /api/content-revisions
  3. Feedback events from /api/feedback
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  generateMockEntities,
  editorialStatusMeta,
  type EditorialStatus,
} from '~/components/sketches/mockData'
import SketchCrossNav from '~/components/sketches/SketchCrossNav.vue'

definePageMeta({ layout: 'default' })

const toast = useToast()

// --- Entity context ---
const allEntities = generateMockEntities(10)
const selectedEntityId = ref(allEntities[0]!.id)
const entity = computed(() => allEntities.find(e => e.id === selectedEntityId.value) ?? allEntities[0]!)
const entityOptions = allEntities.map(e => ({ label: `${e.name} (${e.entity_type})`, value: e.id }))

// --- Event types ---
type TimelineEventType = 'transition' | 'revision' | 'translation' | 'feedback'

interface TimelineEvent {
  id: number
  type: TimelineEventType
  actor: string
  timestamp: string
  title: string
  description: string
  metadata?: Record<string, string>
}

// --- Mock timeline data ---
function generateTimeline(): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { id: 1, type: 'transition', actor: 'alice', timestamp: '2026-02-12T08:00:00Z', title: 'Created as Draft', description: 'Entity created with initial English content.', metadata: { from: '', to: 'draft' } },
    { id: 2, type: 'revision', actor: 'alice', timestamp: '2026-02-12T08:05:00Z', title: 'Content Revision v1', description: 'Initial content: title, subtitle, description, keywords.', metadata: { version: '1', snapshot_id: '101' } },
    { id: 3, type: 'translation', actor: 'bob', timestamp: '2026-02-12T10:30:00Z', title: 'FR Translation Added', description: 'French translation created for title, subtitle, description.', metadata: { lang: 'FR', status: 'draft' } },
    { id: 4, type: 'revision', actor: 'alice', timestamp: '2026-02-12T14:00:00Z', title: 'Content Revision v2', description: 'Updated description with expanded symbolism section.', metadata: { version: '2', snapshot_id: '102' } },
    { id: 5, type: 'feedback', actor: 'carol', timestamp: '2026-02-12T15:00:00Z', title: 'Feedback: Description', description: 'Card description is too vague. Need more detail about journey symbolism.', metadata: { field_path: 'description', status: 'open' } },
    { id: 6, type: 'transition', actor: 'alice', timestamp: '2026-02-12T16:00:00Z', title: 'Submitted for Review', description: 'Moved from Draft to Pending Review.', metadata: { from: 'draft', to: 'pending_review' } },
    { id: 7, type: 'translation', actor: 'carol', timestamp: '2026-02-13T09:00:00Z', title: 'ES Translation Added', description: 'Spanish translation created.', metadata: { lang: 'ES', status: 'draft' } },
    { id: 8, type: 'transition', actor: 'dave', timestamp: '2026-02-13T10:00:00Z', title: 'Review Started', description: 'Reviewer dave picked up the entity for review.', metadata: { from: 'pending_review', to: 'review' } },
    { id: 9, type: 'feedback', actor: 'dave', timestamp: '2026-02-13T10:30:00Z', title: 'Feedback: Title', description: 'FR translation uses "Le Mat" but community prefers "Le Fou".', metadata: { field_path: 'title', lang: 'FR', status: 'open' } },
    { id: 10, type: 'revision', actor: 'alice', timestamp: '2026-02-13T11:00:00Z', title: 'Content Revision v3', description: 'Addressed feedback: expanded description, clarified symbolism.', metadata: { version: '3', snapshot_id: '103' } },
    { id: 11, type: 'feedback', actor: 'dave', timestamp: '2026-02-13T11:30:00Z', title: 'Feedback Resolved', description: 'Description feedback resolved by alice.', metadata: { field_path: 'description', status: 'resolved' } },
    { id: 12, type: 'transition', actor: 'dave', timestamp: '2026-02-13T14:00:00Z', title: 'Approved', description: 'Entity approved after review. Ready for translation review.', metadata: { from: 'review', to: 'approved' } },
  ]
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

const timelineEvents = ref(generateTimeline())

// --- Filters ---
const typeFilter = ref<TimelineEventType | ''>('')
const typeOptions = [
  { label: 'All events', value: '' },
  { label: 'Transitions', value: 'transition' },
  { label: 'Revisions', value: 'revision' },
  { label: 'Translations', value: 'translation' },
  { label: 'Feedback', value: 'feedback' },
]

const filteredEvents = computed(() => {
  if (!typeFilter.value) return timelineEvents.value
  return timelineEvents.value.filter(e => e.type === typeFilter.value)
})

// --- Event type visual config ---
function eventMeta(type: TimelineEventType): { icon: string; color: string; dotColor: string } {
  const map: Record<TimelineEventType, { icon: string; color: string; dotColor: string }> = {
    transition: { icon: 'i-lucide-arrow-right-left', color: 'text-indigo-400', dotColor: 'bg-indigo-400' },
    revision: { icon: 'i-lucide-file-edit', color: 'text-emerald-400', dotColor: 'bg-emerald-400' },
    translation: { icon: 'i-lucide-languages', color: 'text-amber-400', dotColor: 'bg-amber-400' },
    feedback: { icon: 'i-lucide-message-circle', color: 'text-rose-400', dotColor: 'bg-rose-400' },
  }
  return map[type]
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
</script>

<template>
  <div class="min-h-screen bg-default flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-30 border-b border-default bg-default/95 backdrop-blur-sm">
      <div class="flex items-center justify-between px-4 py-3 max-w-4xl mx-auto">
        <div class="flex items-center gap-3">
          <NuxtLink to="/sketches" class="text-muted hover:text-primary transition-colors" aria-label="Back to sketches">
            <UIcon name="i-lucide-arrow-left" />
          </NuxtLink>
          <h1 class="text-lg font-bold tracking-tight">Timeline View</h1>
          <UBadge color="primary" variant="subtle" size="xs">Phase 3</UBadge>
        </div>

        <div class="flex items-center gap-3">
          <USelect
            :model-value="selectedEntityId"
            :items="entityOptions"
            size="xs"
            class="w-56"
            aria-label="Select entity"
            @update:model-value="selectedEntityId = Number($event)"
          />
          <USelect
            :model-value="typeFilter"
            :items="typeOptions"
            size="xs"
            class="w-36"
            aria-label="Filter by event type"
            @update:model-value="typeFilter = $event as TimelineEventType | ''"
          />
        </div>
      </div>
    </header>

    <!-- Cross-navigation -->
    <SketchCrossNav :entity-name="entity.name" current-view="timeline" />

    <main class="flex-1 p-6 max-w-4xl mx-auto w-full">
      <!-- Entity header -->
      <div class="flex items-center gap-3 mb-6 pb-4 border-b border-default">
        <h2 class="text-sm font-bold">{{ entity.name }}</h2>
        <UBadge color="neutral" variant="outline" size="xs">{{ entity.entity_type }}</UBadge>
        <UBadge
          :color="editorialStatusMeta(entity.status).color"
          :variant="editorialStatusMeta(entity.status).variant"
          :icon="editorialStatusMeta(entity.status).icon"
          size="xs"
        >
          {{ editorialStatusMeta(entity.status).label }}
        </UBadge>
        <span class="text-xs text-muted ml-auto">{{ filteredEvents.length }} events</span>
      </div>

      <!-- Timeline -->
      <div class="relative">
        <!-- Vertical line -->
        <div class="absolute left-5 top-0 bottom-0 w-px bg-default" />

        <div class="space-y-0">
          <div
            v-for="event in filteredEvents"
            :key="event.id"
            class="relative flex gap-4 pb-6"
          >
            <!-- Timeline dot -->
            <div class="relative z-10 flex items-center justify-center w-10 shrink-0">
              <div
                class="w-3 h-3 rounded-full ring-4 ring-default"
                :class="eventMeta(event.type).dotColor"
              />
            </div>

            <!-- Event card -->
            <div class="flex-1 rounded-lg border border-default p-3 space-y-2 hover:border-primary/30 transition-colors">
              <div class="flex items-center gap-2 flex-wrap">
                <UIcon :name="eventMeta(event.type).icon" :class="eventMeta(event.type).color" class="text-sm" />
                <span class="text-xs font-semibold">{{ event.title }}</span>
                <span class="text-[10px] text-muted ml-auto tabular-nums">{{ relativeTime(event.timestamp) }}</span>
              </div>

              <p class="text-xs text-muted leading-relaxed">{{ event.description }}</p>

              <!-- Metadata badges -->
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[10px] text-muted">by <strong>{{ event.actor }}</strong></span>

                <!-- Transition: from → to -->
                <template v-if="event.type === 'transition' && event.metadata">
                  <template v-if="event.metadata.from">
                    <UBadge
                      :color="editorialStatusMeta(event.metadata.from as EditorialStatus).color"
                      variant="outline"
                      size="xs"
                    >
                      {{ editorialStatusMeta(event.metadata.from as EditorialStatus).label }}
                    </UBadge>
                    <UIcon name="i-lucide-arrow-right" class="text-[10px] text-muted" />
                  </template>
                  <UBadge
                    :color="editorialStatusMeta(event.metadata.to as EditorialStatus).color"
                    :variant="editorialStatusMeta(event.metadata.to as EditorialStatus).variant"
                    size="xs"
                  >
                    {{ editorialStatusMeta(event.metadata.to as EditorialStatus).label }}
                  </UBadge>
                </template>

                <!-- Revision: version + diff link -->
                <template v-if="event.type === 'revision' && event.metadata">
                  <UBadge color="neutral" variant="outline" size="xs">
                    v{{ event.metadata.version }}
                  </UBadge>
                  <UButton
                    label="View diff"
                    icon="i-lucide-diff"
                    size="xs"
                    variant="ghost"
                    color="primary"
                    @click="toast.add({ title: `View diff for snapshot #${event.metadata!.snapshot_id}`, color: 'neutral' })"
                  />
                </template>

                <!-- Translation: lang badge -->
                <template v-if="event.type === 'translation' && event.metadata">
                  <UBadge color="neutral" variant="outline" size="xs">
                    {{ event.metadata.lang }}
                  </UBadge>
                  <UBadge
                    :color="event.metadata.status === 'draft' ? 'warning' : 'success'"
                    variant="soft"
                    size="xs"
                  >
                    {{ event.metadata.status }}
                  </UBadge>
                </template>

                <!-- Feedback: field + status -->
                <template v-if="event.type === 'feedback' && event.metadata">
                  <UBadge v-if="event.metadata.field_path" color="neutral" variant="subtle" size="xs" icon="i-lucide-map-pin">
                    {{ event.metadata.field_path }}
                  </UBadge>
                  <UBadge v-if="event.metadata.lang" color="neutral" variant="outline" size="xs">
                    {{ event.metadata.lang }}
                  </UBadge>
                  <UBadge
                    :color="event.metadata.status === 'open' ? 'warning' : event.metadata.status === 'resolved' ? 'success' : 'primary'"
                    variant="soft"
                    size="xs"
                  >
                    {{ event.metadata.status }}
                  </UBadge>
                </template>
              </div>

              <!-- Timestamp -->
              <p class="text-[10px] text-muted/60 tabular-nums">{{ new Date(event.timestamp).toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!filteredEvents.length" class="text-center py-16">
          <UIcon name="i-lucide-clock" class="text-4xl text-muted/30 mb-3" />
          <p class="text-sm text-muted">No events match the current filter.</p>
        </div>
      </div>
    </main>

    <!-- Integration notes -->
    <div class="border-t border-default p-4 bg-muted/10">
      <p class="text-xs text-muted text-center max-w-3xl mx-auto leading-relaxed">
        <strong>Integration:</strong> Events from <code class="text-xs">/api/editorial/audit-log</code>,
        <code class="text-xs">/api/content-revisions</code>, and <code class="text-xs">/api/feedback</code>.
        "View diff" links to Diff/Compare View. Tab in EntitySlideover or standalone route.
      </p>
    </div>
  </div>
</template>
