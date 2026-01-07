<!-- 
  Component: BaseImportModal
  Purpose: Orchestrates ImportJson using EntityBaseContext
-->
<template>
  <ImportJson
    :open="ctx.importModalOpen.value"
    :title="ctx.importModalTitle.value"
    :description="null"
    :loading="ctx.importing.value"
    :error="ctx.importError.value"
    :confirm-label="$t('ui.actions.import') || 'Import'"
    :cancel-label="$t('ui.actions.cancel') || 'Cancel'"
    @submit="ctx.handleImportSubmit"
    @cancel="ctx.closeImportModal"
    @update:open="ctx.setImportOpen"
  />
</template>

<script setup lang="ts">
import { useEntityBase } from '~/composables/manage/useEntityBaseContext'
import ImportJson from '~/components/manage/modal/ImportJson.vue'

const ctx = useEntityBase()
</script>
