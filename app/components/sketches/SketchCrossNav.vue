<!--
  components/sketches/SketchCrossNav.vue
  Cross-navigation bar for sketch pages.
  Shows quick links to related views for the current entity context.
-->
<script setup lang="ts">
withDefaults(defineProps<{
  entityType?: string
  entityId?: number
  entityName?: string
  currentView?: string
}>(), {
  entityType: 'base_card',
  entityId: 1,
  entityName: '',
  currentView: '',
})

const navItems = [
  { key: 'list', label: 'List', icon: 'i-lucide-table-2', to: '/sketches/editorial-list' },
  { key: 'board', label: 'Board', icon: 'i-lucide-kanban', to: '/sketches/editorial-board' },
  { key: 'studio', label: 'Studio', icon: 'i-lucide-palette', to: '/sketches/studio-card-editor' },
  { key: 'feedback', label: 'Feedback', icon: 'i-lucide-message-square', to: '/sketches/feedback-workflow' },
  { key: 'timeline', label: 'Timeline', icon: 'i-lucide-clock', to: '/sketches/timeline-view' },
  { key: 'diff', label: 'Diff', icon: 'i-lucide-diff', to: '/sketches/diff-compare' },
  { key: 'deps', label: 'Deps', icon: 'i-lucide-git-fork', to: '/sketches/dependency-tree' },
  { key: 'codex', label: 'Codex', icon: 'i-lucide-book-open', to: '/sketches/codex-grimoire' },
  { key: 'images', label: 'Images', icon: 'i-lucide-image', to: '/sketches/image-system' },
  { key: 'map', label: 'Map', icon: 'i-lucide-network', to: '/sketches/entity-map' },
  { key: 'views', label: 'Views', icon: 'i-lucide-layout-grid', to: '/sketches/card-views' },
]
</script>

<template>
  <div class="flex items-center gap-1 overflow-x-auto py-1 px-2 border-b border-default bg-muted/5">
    <span v-if="entityName" class="text-[10px] text-muted shrink-0 mr-1">{{ entityName }} →</span>
    <NuxtLink
      v-for="item in navItems"
      :key="item.key"
      :to="item.to"
      class="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors shrink-0"
      :class="currentView === item.key ? 'bg-primary/10 text-primary' : 'text-muted hover:text-primary hover:bg-muted/10'"
      :aria-label="`Navigate to ${item.label}`"
      :aria-current="currentView === item.key ? 'page' : undefined"
    >
      <UIcon :name="item.icon" class="text-[10px]" />
      {{ item.label }}
    </NuxtLink>
  </div>
</template>
