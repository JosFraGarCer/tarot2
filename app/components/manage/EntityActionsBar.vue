<!-- 
  Component: EntityActionsBar
  Purpose: Export and import action buttons
  Responsibilities: 
  - Display export button
  - Display import button
  - Handle loading states
  - Access state and actions from injected EntityBaseContext
-->
<template>
  <div class="flex gap-2">
    <UButton
      size="sm"
      icon="i-heroicons-arrow-up-tray"
      color="neutral"
      variant="soft"
      :loading="ctx.exporting.value"
      :label="$t('ui.actions.export') || 'Export'"
      @click="ctx.exportAll"
    />
    <UButton
      size="sm"
      icon="i-heroicons-arrow-down-tray"
      color="neutral"
      variant="soft"
      :label="$t('importExport.import.actions.trigger') || 'Import'"
      :loading="ctx.importing.value"
      @click="ctx.openImportModal"
    />
  </div>
</template>

<script setup lang="ts">
import { useEntityBase } from '~/composables/manage/useEntityBaseContext'

const ctx = useEntityBase()
</script>
