<!-- app/components/common/ConfirmDeleteModal.vue -->
<template>
  <UModal
    v-model:open="localOpen"
    :title="title"
    :description="description"
  >
    <template #title>
      <span class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{{ title }}</span>
    </template>

    <template #description>
      <span v-if="description" class="text-sm text-neutral-600 dark:text-neutral-300">{{ description }}</span>
    </template>

    <template #body>
      <div class="space-y-3">
        <UAlert
          color="warning"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          :title="title"
          :description="description"
        />
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="soft" :label="cancelLabel" @click="onCancel" />
        <UButton color="error" :label="confirmLabel" :loading="loading" @click="onConfirm" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
}>(), {
  open: false,
  description: '',
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel',
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const localOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

function onCancel() {
  emit('cancel')
  emit('update:open', false)
}

function onConfirm() {
  emit('confirm')
}
</script>
