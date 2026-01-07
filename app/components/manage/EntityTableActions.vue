<!-- 
  Component: EntityTableActions
  Purpose: Table action buttons for toolbar, bulk actions, and selection
  Responsibilities: 
  - Toolbar actions (create button, selection count)
  - Bulk actions (export, update)
  - Selection display and clear
  - Empty state
  - Loading state
  - Row actions (edit, preview, delete, etc.)
-->
<template>
  <div class="entity-table-actions">
    <!-- This component provides action handlers for table components -->
    <!-- The actual slot templates will be defined inline in the parent component -->
  </div>
</template>

<script setup lang="ts">
interface Props {
  allowPreview?: boolean
  allowTags?: boolean
  emptyTitle?: string
  emptySubtitle?: string
  emptyCreateLabel?: string
  emptyResetLabel?: string
}

defineProps<Props>()

defineEmits<{
  create: []
  'export-selected': [selected: number[]]
  'bulk-update': [selected: unknown]
  'clear-selection': []
  edit: [entity: unknown]
  'full-edit': [entity: unknown]
  preview: [entity: unknown]
  feedback: [entity: unknown]
  tags: [entity: unknown]
  delete: [entity: unknown]
  'reset-filters': []
}>()
</script>
