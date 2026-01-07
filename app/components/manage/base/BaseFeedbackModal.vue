<!-- 
  Component: BaseFeedbackModal
  Purpose: Orchestrates FeedbackModal using EntityBaseContext
-->
<template>
  <FeedbackModal
    :open="ctx.feedbackModalOpen.value"
    :entity-id="ctx.feedbackEntityId.value"
    :entity-type="ctx.feedbackEntityType.value"
    :entity-name="ctx.feedbackEntityName.value"
    :entity-label="ctx.label.value"
    :saving="ctx.feedbackSaving.value"
    @update:open="ctx.handleFeedbackOpenChange"
    @submit="ctx.handleFeedbackSubmit"
  />
</template>

<script setup lang="ts">
import { useEntityBase } from '~/composables/manage/useEntityBaseContext'
import FeedbackModal from '~/components/manage/modal/FeedbackModal.vue'

const ctx = useEntityBase()
</script>
