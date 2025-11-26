<!-- app/components/manage/ViewControls.vue -->
<!-- /app/components/manage/ViewControls.vue -->
<template>
  <div class="flex items-center gap-2">
    <USelectMenu
      v-if="modelValue === 'carta'"
      v-model="internalTemplate"
      :items="templateOptions"
      value-key="value"
      size="xs"
      class="w-40"
      :placeholder="$t('ui.fields.template')"
    />
    <UTooltip :text="$t('viewModes.card')">
      <UButton
        icon="i-heroicons-square-3-stack-3d"
        size="md"
        :variant="modelValue === 'tarjeta' ? 'solid' : 'soft'"
        color="neutral"
        @click="setMode('tarjeta')"
      />
    </UTooltip>
    <UTooltip :text="$t('viewModes.classic')">
      <UButton
        icon="i-heroicons-view-columns"
        size="md"
        :variant="modelValue === 'classic' ? 'solid' : 'soft'"
        color="neutral"
        @click="setMode('classic')"
      />
    </UTooltip>
    <UTooltip :text="$t('viewModes.carta')">
      <UButton
        icon="i-heroicons-rectangle-stack"
        size="md"
        :variant="modelValue === 'carta' ? 'solid' : 'soft'"
        color="neutral"
        @click="setMode('carta')"
      />
    </UTooltip>
    <UTooltip :text="$t('viewModes.table')">
      <UButton
        icon="i-heroicons-table-cells"
        size="md"
        :variant="modelValue === 'tabla' ? 'solid' : 'soft'"
        color="neutral"
        :disabled="disableTable"
        :title="disableTable ? $t('viewModes.tableSoon') : ''"
        @click="setMode('tabla')"
      />
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

export type ViewMode = 'tarjeta' | 'classic' | 'carta' | 'tabla'

const props = defineProps<{
  modelValue: ViewMode
  templateKey?: string
  templateOptions: Array<{ label: string; value: string }>
  storageKey?: string
  disableTable?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ViewMode): void
  (e: 'update:templateKey', value: string): void
}>()

const internalTemplate = ref(props.templateKey || '')

const setMode = (mode: ViewMode) => {
  emit('update:modelValue', mode)
}

watch(() => props.templateKey, v => { if (v !== undefined) internalTemplate.value = v })
watch(internalTemplate, v => emit('update:templateKey', v))

watch(() => props.modelValue, (v) => {
  if (props.storageKey) localStorage.setItem(`${props.storageKey}.mode`, v)
})

watch(() => internalTemplate.value, (v) => {
  if (props.storageKey) localStorage.setItem(`${props.storageKey}.template`, v || '')
})
</script>
