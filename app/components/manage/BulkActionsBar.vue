<template>
  <Transition name="fade">
    <div
      v-if="hasSelection"
      class="bulk-actions-bar sticky top-24 z-30 w-full rounded-lg border border-neutral-200 bg-white/95 px-4 py-3 shadow-sm ring-1 ring-neutral-200 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95 dark:ring-neutral-700"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
          <UIcon name="i-heroicons-check-circle" class="h-5 w-5 text-primary-500" />
          <span>{{ selectionLabel }}</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <slot :selected="selected" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'

const props = withDefaults(defineProps<{
  selected?: Array<string | number>
}>(), {
  selected: () => [],
})

const { t } = useI18n()

const selected = computed(() => props.selected)
const hasSelection = computed(() => selected.value.length > 0)

const selectionLabel = computed(() =>
  t('ui.table.itemsSelected', { count: selected.value.length }) as string,
)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
