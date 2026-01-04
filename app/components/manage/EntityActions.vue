<!-- app/components/manage/EntityActions.vue -->
<!-- app/components/manage/common/EntityActionsNew.vue -->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  entity: { id: number; name?: string; code?: string; language_code?: string | null }
  entityLabel: string
  entityType: string
  onEdit?: (entity: Record<string, unknown>) => void
  vertical?: boolean
  noTags?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', entity: Record<string, unknown>): void
  (e: 'editform', entity: Record<string, unknown>): void
  (e: 'feedback', entity: Record<string, unknown>): void
  (e: 'tags', entity: Record<string, unknown>): void
  (e: 'delete', entity: Record<string, unknown>): void
}>()

const containerClass = computed(() =>
  props.vertical
    ? 'flex flex-col gap-1'
    : 'flex flex-row gap-1 justify-end flex-wrap items-center'
)
function handleEditClick() {
  const entity = props.entity
  emit('edit', entity)
  emit('editform', entity)
  props.onEdit?.(entity)
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
        @click="$emit('feedback', props.entity)"
      />
    </div>

    <!-- Tags -->
    <div v-if="!noTags" v-can="['canAssignTags','canEditContent']">
      <UButton
        icon="i-heroicons-tag"
        size="xs"
        color="neutral"
        variant="soft"
        @click="$emit('tags', props.entity)"
      />
    </div>

    <!-- Delete -->
    <div v-can.disable="['canEditContent','canPublish']">
      <UButton
        icon="i-heroicons-trash"
        size="xs"
        color="error"
        variant="soft"
        @click="$emit('delete', props.entity)"
      />
    </div>
  </div>
</template>
