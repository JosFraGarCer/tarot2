<!-- app/components/manage/EntityActions.vue -->
<!-- app/components/manage/common/EntityActionsNew.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useEntityBase } from '~/composables/manage/useEntityBaseContext'

const props = defineProps<{
  entity: { id: number; name?: string; code?: string; language_code?: string | null }
  vertical?: boolean
}>()

const ctx = useEntityBase()

const containerClass = computed(() =>
  props.vertical
    ? 'flex flex-col gap-1'
    : 'flex flex-row gap-1 justify-end flex-wrap items-center'
)

const allowTags = computed(() => {
  return ctx.capabilities.value.hasTags !== false && ctx.noTags.value !== true
})

function handleEditClick() {
  ctx.onEdit(props.entity)
}
</script>

<template>
  <div :class="containerClass">
    <!-- Edit -->
    <div v-can="['canEditContent','canTranslate']">
      <UButton
        icon="i-heroicons-pencil"
        size="xs"
        color="primary"
        variant="soft"
        :aria-label="$t('ui.actions.quickEdit')"
        @click="handleEditClick"
      />
    </div>

    <!-- Feedback -->
    <div v-can="'canResolveFeedback'">
      <UButton
        icon="i-heroicons-exclamation-triangle"
        size="xs"
        color="warning"
        variant="soft"
        aria-label="Feedback"
        @click="ctx.onFeedback(props.entity)"
      />
    </div>

    <!-- Tags -->
    <div v-if="allowTags" v-can="['canAssignTags','canEditContent']">
      <UButton
        icon="i-heroicons-tag"
        size="xs"
        color="neutral"
        variant="soft"
        aria-label="Tags"
        @click="ctx.onTags(props.entity)"
      />
    </div>

    <!-- Delete -->
    <div v-can.disable="['canEditContent','canPublish']">
      <UButton
        icon="i-heroicons-trash"
        size="xs"
        color="error"
        variant="soft"
        aria-label="Delete"
        @click="ctx.onDelete(props.entity)"
      />
    </div>
  </div>
</template>
