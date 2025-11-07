<!-- app/components/manage/common/EntityActionsNew.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'
import { useCardStatus } from '~/utils/status'

const props = defineProps<{
  entity: { id: number; name?: string; code?: string; language_code?: string | null }
  entityLabel: string
  entityType: string
  onEdit?: (entity: any) => void
  vertical?: boolean
  noTags?: boolean
}>()

const emit = defineEmits<{
  (e: 'editform', entity: any): void
  (e: 'feedback', entity: any): void
  (e: 'tags', entity: any): void
  (e: 'delete', entity: any): void
}>()

const { t, locale } = useI18n()
const localeCode = computed(() => (typeof locale === 'string' ? locale : locale.value))
const statusUtil = useCardStatus()

const statusMenu = computed(() => [
  statusUtil.options().map(o => ({ label: t(o.labelKey), value: o.value }))
])

const containerClass = computed(() =>
  props.vertical
    ? 'flex flex-col gap-1'
    : 'flex flex-row gap-1 justify-end flex-wrap items-center'
)
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
        @click="$emit('editform', props.entity)"
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
