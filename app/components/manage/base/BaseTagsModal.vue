<!-- 
  Component: BaseTagsModal
  Purpose: Orchestrates EntityTagsModal using EntityBaseContext
-->
<template>
  <EntityTagsModal
    :open="ctx.tagsModalOpen.value"
    :title="ctx.tagsModalTitle.value"
    :description="null"
    :model-value="ctx.tagsSelection.value"
    :options="ctx.tagsOptions.value"
    :saving="ctx.tagsSaving.value"
    :confirm-label="$t('ui.actions.save') || 'Save'"
    :cancel-label="$t('ui.actions.cancel') || 'Cancel'"
    @update:open="ctx.handleTagsModalOpenChange"
    @update:model-value="ctx.setTagsSelection"
    @confirm="ctx.confirmTags"
  />
</template>

<script setup lang="ts">
import { useEntityBase } from '~/composables/manage/useEntityBaseContext'
import EntityTagsModal from '~/components/manage/modal/EntityTagsModal.vue'

const ctx = useEntityBase()
</script>
