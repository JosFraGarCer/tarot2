<!-- app/components/manage/modal/EntityTagsModal.vue -->
<!-- app/components/manage/Modal/EntityTagsModal.vue -->
<script setup lang="ts">
import { computed } from 'vue'

type TagOption = { label: string; value: number }

const props = defineProps<{
  open: boolean
  title: string
  description?: string | null
  modelValue: number[]
  options: TagOption[]
  saving?: boolean
  confirmLabel?: string
  cancelLabel?: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:modelValue', value: number[]): void
  (e: 'confirm'): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const selectedOptions = computed(() => {
  const values = Array.isArray(props.modelValue) ? props.modelValue : []
  return (props.options || []).filter(o => values.includes(o.value))
})

const sortedOptions = computed(() => {
  const values = Array.isArray(props.modelValue) ? props.modelValue : []
  if (!Array.isArray(props.options) || props.options.length === 0) return props.options ?? []
  const selected = new Set(values)
  const selectedItems: TagOption[] = []
  const unselectedItems: TagOption[] = []
  for (const option of props.options) {
    if (selected.has(option.value)) selectedItems.push(option)
    else unselectedItems.push(option)
  }
  return [...selectedItems, ...unselectedItems]
})

const clearAll = () => emit('update:modelValue', [])
const onSubmit = () => emit('confirm')
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="description || undefined"
  >
    <template #body>
      <UForm @submit="onSubmit">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="text-sm text-neutral-600 dark:text-neutral-400">
              {{ $t('ui.table.selected') }}: {{ (modelValue || []).length }}
            </div>
            <div class="flex gap-2">
              <UButton size="xs" color="neutral" variant="soft" :label="$t('ui.actions.clear')" @click="clearAll" />
            </div>
          </div>

          <UFormField :label="$t('ui.fields.tags')">
            <USelectMenu
              multiple
              searchable
              clearable
              :items="sortedOptions"
              value-key="value"
              class="w-full"
              option-attribute="label"
              :model-value="modelValue"
              @update:model-value="val => $emit('update:modelValue', val as number[])"
            />
          </UFormField>

          <div v-if="selectedOptions.length" class="flex flex-wrap gap-1">
            <UBadge
              v-for="opt in selectedOptions"
              :key="`tag-${opt.value}`"
              size="sm"
              color="info"
              variant="soft"
            >
              {{ opt.label }}
            </UBadge>
          </div>
        </div>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton color="neutral" variant="soft" :label="cancelLabel || $t('ui.actions.cancel')" @click="$emit('update:open', false)" />
        <UButton color="primary" :loading="saving" :label="confirmLabel || $t('ui.actions.save')" @click="onSubmit" />
      </div>
    </template>
  </UModal>
</template>