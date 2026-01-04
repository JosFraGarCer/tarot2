<!-- app/components/manage/modal/ImportJson.vue -->
<!-- app/components/manage/Modal/ImportJson.vue -->
<template>
  <UModal
    v-model:open="internalOpen"
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
      <div class="space-y-4">
        <div class="space-y-2">
          <label :for="inputId" class="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            {{ fileLabel }}
          </label>
          <UInput
            :id="inputId"
            ref="fileInputRef"
            type="file"
            :accept="accept"
            class="block w-full text-sm text-neutral-600 dark:text-neutral-300"
            @change="handleFileChange"
          />
          <p v-if="fileName" class="text-xs text-neutral-500 dark:text-neutral-400">
            {{ fileName }}
          </p>
        </div>
        <slot name="notice" />
        <UAlert v-if="displayError" color="error" variant="soft" :title="displayError" />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral" variant="soft"
          :label="cancelLabel"
          :disabled="loading"
          @click="handleCancel"
        />
        <UButton
          color="primary"
          :label="confirmLabel"
          :loading="loading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  loading?: boolean
  confirmLabel?: string
  cancelLabel?: string
  accept?: string
  fileLabel?: string
  error?: string | null
}>(), {
  description: undefined,
  loading: false,
  confirmLabel: 'Import',
  cancelLabel: 'Cancel',
  accept: 'application/json',
  fileLabel: 'JSON file',
  error: null
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'submit', file: File): void
  (e: 'cancel'): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const localError = ref<string | null>(null)
const inputId = `import-json-${Math.random().toString(36).slice(2)}`

const internalOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const fileName = computed(() => selectedFile.value?.name ?? '')
const displayError = computed(() => props.error || localError.value)

const resetState = () => {
  selectedFile.value = null
  localError.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

watch(
  () => props.open,
  (value) => {
    if (!value) {
      resetState()
    }
  }
)

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const [file] = target.files ? Array.from(target.files) : []
  selectedFile.value = file ?? null
  localError.value = null
}

const handleCancel = () => {
  emit('cancel')
  emit('update:open', false)
}

const handleSubmit = () => {
  if (!selectedFile.value) {
    localError.value = 'Please select a JSON file.'
    return
  }
  emit('submit', selectedFile.value)
}
</script>
