<!-- app/components/common/MarkdownEditor.vue -->
<!-- /app/components/common/MarkDownEditor.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import MarkdownPreview from '~/components/common/MarkdownPreview.vue'

const props = defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
}>()

const emit = defineEmits(['update:modelValue'])
const text = ref(props.modelValue || '')

// Sincroniza el texto con el padre
watch(
  () => props.modelValue,
  (val) => {
    if (val !== text.value) text.value = val || ''
  }
)
watch(text, (val) => emit('update:modelValue', val))
</script>

<template>
  <div class="space-y-3">
    <UFormField :label="label || 'Markdown Content'">
      <UTextarea
        v-model="text"
        :placeholder="placeholder || 'Write markdown content...'"
        autoresize
        :rows="2"
        :maxrows="6"
        class="font-mono text-sm w-full"
      />
    </UFormField>

    <div class="p-3 border-1 rounded-md">
      <UFormField label="Preview">
        <MarkdownPreview :content="text" />
      </UFormField>
    </div>
  </div>
</template>
