<!-- app/components/manage/form/ImageUploadField.vue -->
<template>
  <div v-can="['canEditContent','canPublish']">
  <UFormField v-if="enabled" :label="field.label" :required="field.required">
    <slot name="hint" :field="field">
      <p v-if="field.hint" class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
        {{ field.hint }}
      </p>
    </slot>
    <UFileUpload
      v-if="!preview || preview === ''"
      v-model="internalModel"
      accept="image/*"
      icon="i-heroicons-photo"
      class="w-full min-h-32"
      :disabled="field.disabled || disabled"
      :label="field.dropLabel"
      :description="field.description"
    />
    <div v-else class="mt-3 flex items-start gap-3">
      <img :src="preview" :alt="field.previewAlt" class="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700" >
      <UButton
        icon="i-heroicons-x-mark"
        color="error"
        variant="ghost"
        size="sm"
        :label="field.removeLabel"
        :disabled="field.disabled || disabled"
        @click="onRemove"
      />
    </div>
  </UFormField>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { normalizeFileValue } from '@/composables/common/useImagePreview'
// import type { ImageFieldConfig } from '@/types/forms'

const props = withDefaults(defineProps<{
  modelValue?: File | null
  preview?: string | null
  field: Required
  enabled?: boolean
  disabled?: boolean
}>(), {
  modelValue: null,
  preview: null,
  enabled: true,
  disabled: false
})

const emit = defineEmits<{ (e: 'update:modelValue', v: File | null): void; (e: 'remove'): void }>()

const internalModel = computed({
  get: () => props.modelValue ?? null,
  set: (value) => {
    const file = normalizeFileValue(value)
    emit('update:modelValue', file)
  }
})

const onUpdate = (value: any) => {
  const file = normalizeFileValue(value)
  emit('update:modelValue', file)
}

const onRemove = () => {
  emit('update:modelValue', null)
  emit('remove')
}


</script>
