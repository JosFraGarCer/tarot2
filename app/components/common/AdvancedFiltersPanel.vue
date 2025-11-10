<!-- app/components/common/AdvancedFiltersPanel.vue -->
<template>
  <UCollapsible class="flex flex-col gap-2" :open="open" @update:open="$emit('update:open', $event)">
    <template #default="{ open: isOpen }">
      <slot name="trigger" :open="isOpen" />
    </template>
    <template #content>
      <div class="grid grid-cols-1 gap-3 p-2 sm:grid-cols-2 lg:grid-cols-3">
        <slot />
      </div>
      <div class="flex items-center justify-end gap-2 p-2">
        <UButton size="xs" color="primary" :label="applyLabel" @click="$emit('apply')" />
        <UButton size="xs" variant="soft" color="neutral" :label="resetLabel" @click="$emit('reset')" />
      </div>
    </template>
  </UCollapsible>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ open?: boolean; applyLabel?: string; resetLabel?: string }>(), {
  open: false,
  applyLabel: 'Apply',
  resetLabel: 'Reset',
})
defineEmits<{
  (e: 'apply'): void
  (e: 'reset'): void
  (e: 'update:open', value: boolean): void
}>()
</script>
