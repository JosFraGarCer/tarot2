<!-- 
  Component: BaseDeleteDialogs
  Purpose: Orchestrates DeleteDialogs using EntityBaseContext
-->
<template>
  <DeleteDialogs
    :delete-open="ctx.deleteModalOpen.value"
    :translation-open="ctx.deleteTranslationModalOpen.value"
    :entity-label="ctx.label.value"
    :on-confirm-delete="ctx.confirmDeleteEntity"
    :on-confirm-translation-delete="ctx.confirmDeleteTranslation"
    :on-cancel="ctx.cancelDeleteDialogs"
    :delete-loading="ctx.deletingSaving.value"
    :translation-loading="ctx.deleteTranslationLoading.value"
    :translation-lang="ctx.pendingDeleteTranslationItem.value?.language_code || ctx.localeCode.value"
  />
</template>

<script setup lang="ts">
import { useEntityBase } from '~/composables/manage/useEntityBaseContext'
import DeleteDialogs from '~/components/manage/common/DeleteDialogs.vue'

const ctx = useEntityBase()
</script>
