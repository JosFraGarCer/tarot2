<!-- app/components/manage/modal/ConfirmDialog.vue -->
<!-- app/components/manage/Modal/ConfirmDialog.vue -->
<template>
  <UModal
    v-model:open="internalOpen"
    :title="title"
    :description="description"
    :ui="ui"
  >
    <template #title>
      <span class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{{ title }}</span>
    </template>

    <template #description>
      <span v-if="description" class="text-sm text-neutral-600 dark:text-neutral-300">{{ description }}</span>
    </template>

    <template #body>
      <slot name="body" />
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="soft"
          :label="cancelLabel"
          @click="handleCancel"
        />
        <UButton
          :color="confirmColor"
          :label="confirmLabel"
          :loading="loading"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonColor } from '@/types/ui'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel: string
  loading?: boolean
  confirmColor?: ButtonColor
  ui?: Record<string, unknown>
}>(), {
  description: undefined,
  loading: false,
  confirmColor: 'error',
  ui: undefined
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const internalOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const handleCancel = () => {
  emit('cancel')
  emit('update:open', false)
}

const handleConfirm = () => {
  emit('confirm')
}
</script>
