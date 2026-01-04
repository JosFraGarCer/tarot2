<!-- app/components/admin/JsonModal.vue -->
<template>
  <UModal
    v-model:open="open"
    :title="title || 'JSON'"
    :description="description || ''"
  >
    <template #body>
      <div class="space-y-2">
        <div class="flex justify-end">
          <UButton
            size="xs"
            variant="soft"
            color="neutral"
            icon="i-heroicons-clipboard"
            :label="copyLabel || 'Copy'"
            @click="copy"
          />
        </div>
        <pre class="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-auto"><code>{{ pretty }}</code></pre>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const open = defineModel<boolean>({ default: false })

const props = withDefaults(defineProps<{
  value?: unknown
  title?: string
  description?: string
  copyLabel?: string
}>(), {
  value: undefined,
  title: 'JSON',
  description: '',
  copyLabel: 'Copy',
})

const pretty = computed(() => {
  try {
    return JSON.stringify(props.value ?? {}, null, 2)
  } catch {
    return String(props.value ?? '')
  }
})

async function copy() {
  try {
    await navigator.clipboard.writeText(pretty.value)
  } catch {
    // ignore copy errors
  }
}
</script>
