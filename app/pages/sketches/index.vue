<!--
  /pages/sketches/index.vue
  Navigation hub for all editorial UX proof-of-concept sketches.
  Each sketch is self-contained with mock data and an auth toggle.
-->
<script setup lang="ts">
definePageMeta({ layout: 'default' })

const sketches = [
  {
    to: '/sketches/editorial-list',
    title: 'Editorial List',
    description: 'Table with editorial_state column, translation coverage, and editorial status filters. Auth toggle shows 401 vs editor view.',
    status: 'P0',
    icon: 'i-lucide-table-2',
  },
  {
    to: '/sketches/entity-row-actions',
    title: 'Entity Row Actions',
    description: 'Redesigned row actions: primary Edit (Slideover), secondary Next Transition, overflow menu. No double-click dependency.',
    status: 'P0',
    icon: 'i-lucide-mouse-pointer-click',
  },
  {
    to: '/sketches/editorial-indicator',
    title: 'Editorial Indicator',
    description: 'Reusable component showing editorial health: status dot + translation fraction + next action hint.',
    status: 'P1',
    icon: 'i-lucide-activity',
  },
  {
    to: '/sketches/create-flow',
    title: 'Create Flow',
    description: 'Improved entity creation with post-create guidance to add translations. Toast with action button.',
    status: 'P1',
    icon: 'i-lucide-plus-circle',
  },
  {
    to: '/sketches/delete-preview',
    title: 'Delete Preview',
    description: 'Delete confirmation with explicit impact preview: base entity vs translation, cascading effects.',
    status: 'P1',
    icon: 'i-lucide-trash-2',
  },
  {
    to: '/sketches/dashboard-v2',
    title: 'Dashboard v2',
    description: 'Editorial dashboard using editorial_state from list endpoints. Single call per entity, grouped by status.',
    status: 'P1',
    icon: 'i-lucide-layout-dashboard',
  },
  {
    to: '/sketches/studio-card-editor',
    title: 'Studio Card Editor',
    description: 'Visual-first card editor: centered tarot preview, side panel for metadata/translations/editorial/feedback, top status bar.',
    status: 'P0',
    icon: 'i-lucide-palette',
  },
  {
    to: '/sketches/editorial-board',
    title: 'Editorial Board',
    description: 'Kanban-style editorial workflow board. Drag-and-drop between status columns, filter by entity type, quick transitions.',
    status: 'P0',
    icon: 'i-lucide-kanban',
  },
  {
    to: '/sketches/image-system',
    title: 'Image System',
    description: 'Image upload, gallery, versioning and selection prototype. Drag & drop, version history, side-by-side compare.',
    status: 'P1',
    icon: 'i-lucide-image',
  },
  {
    to: '/sketches/feedback-workflow',
    title: 'Feedback Workflow',
    description: 'Threaded feedback panel with per-comment status, editorial integration, filtering, and resolution UX.',
    status: 'P0',
    icon: 'i-lucide-message-square',
  },
  {
    to: '/sketches/card-views',
    title: 'Card Views',
    description: 'Multiple view modes for the same entity: Tarot, Lore, Technical, and Collection Grid.',
    status: 'P1',
    icon: 'i-lucide-layout-grid',
  },
  {
    to: '/sketches/entity-map',
    title: 'Entity Map',
    description: 'SVG node graph visualizing relationships between base_card, world_card, facet, arcana, skill.',
    status: 'P1',
    icon: 'i-lucide-network',
  },
  {
    to: '/sketches/codex-grimoire',
    title: 'Codex / Grimoire',
    description: 'Immersive encyclopedia-style browse. Codex index + Grimoire card-by-card reading with keyboard navigation.',
    status: 'P2',
    icon: 'i-lucide-book-open',
  },
  {
    to: '/sketches/timeline-view',
    title: 'Timeline View',
    description: 'Chronological timeline of editorial events: status transitions, content revisions, translation updates, feedback.',
    status: 'P2',
    icon: 'i-lucide-clock',
  },
  {
    to: '/sketches/diff-compare',
    title: 'Diff / Compare',
    description: 'Side-by-side comparison of content revision snapshots with field-level diff highlighting.',
    status: 'P2',
    icon: 'i-lucide-diff',
  },
  {
    to: '/sketches/dependency-tree',
    title: 'Dependency Tree',
    description: 'Collapsible tree view of entity dependencies with health status and blocker indicators.',
    status: 'P2',
    icon: 'i-lucide-git-fork',
  },
]

const priorityColor = (status: string) => {
  if (status === 'P0') return 'error' as const
  if (status === 'P1') return 'warning' as const
  return 'neutral' as const
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold tracking-tight">
        Editorial UX Sketches
      </h1>
      <p class="text-sm text-muted mt-1">
        Proof-of-concept pages for editorial workflow improvements. Each sketch uses mock data and includes an auth toggle.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <NuxtLink
        v-for="sketch in sketches"
        :key="sketch.to"
        :to="sketch.to"
        class="group block rounded-lg border border-default p-4 hover:border-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      >
        <div class="flex items-start gap-3">
          <UIcon :name="sketch.icon" class="text-xl text-muted mt-0.5 shrink-0" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-semibold text-sm group-hover:text-primary transition-colors">
                {{ sketch.title }}
              </span>
              <UBadge :color="priorityColor(sketch.status)" variant="subtle" size="xs">
                {{ sketch.status }}
              </UBadge>
            </div>
            <p class="text-xs text-muted leading-relaxed">
              {{ sketch.description }}
            </p>
          </div>
          <UIcon name="i-lucide-arrow-right" class="text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
        </div>
      </NuxtLink>
    </div>

    <div class="mt-8 p-4 rounded-lg bg-muted/30 border border-default">
      <p class="text-xs text-muted">
        <strong>Integration note:</strong> These sketches use mock data from
        <code class="text-xs">components/sketches/mockData.ts</code>.
        To connect to real API, replace mock calls with <code class="text-xs">useEntity.ts</code> composable.
        Each sketch documents integration steps in source comments.
      </p>
    </div>
  </div>
</template>
