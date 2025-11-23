<template>
  <UTooltip v-if="shouldShowTooltip" :text="tooltipText" :open-delay="150">
    <UChip
      :color="color"
      :variant="variant"
      :size="size"
      class="tag-chip inline-flex items-center gap-1"
      v-bind="$attrs"
    >
      <template v-if="$slots.icon" #leading>
        <slot name="icon" />
      </template>
      <template v-else-if="icon" #leading>
        <UIcon :name="icon" class="text-xs" aria-hidden="true" />
      </template>
      <slot>
        {{ label }}
      </slot>
    </UChip>
  </UTooltip>
  <UChip
    v-else
    :color="color"
    :variant="variant"
    :size="size"
    class="tag-chip inline-flex items-center gap-1"
    v-bind="$attrs"
  >
    <template v-if="$slots.icon" #leading>
      <slot name="icon" />
    </template>
    <template v-else-if="icon" #leading>
      <UIcon :name="icon" class="text-xs" aria-hidden="true" />
    </template>
    <slot>
      {{ label }}
    </slot>
  </UChip>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    color?: string
    variant?: 'soft' | 'subtle'
    size?: 'xs' | 'sm'
    icon?: string | null
    tooltip?: boolean | string
    tooltipThreshold?: number
  }>(),
  {
    color: 'neutral',
    variant: 'subtle',
    size: 'xs',
    icon: null,
    tooltip: true,
    tooltipThreshold: 24,
  },
)

const color = computed(() => props.color)
const variant = computed(() => props.variant)
const size = computed(() => props.size)
const icon = computed(() => props.icon)

const tooltipText = computed(() => {
  if (typeof props.tooltip === 'string') return props.tooltip
  return props.label
})

const shouldShowTooltip = computed(() => {
  if (props.tooltip === false) return false
  if (typeof props.tooltip === 'string') return true
  return (props.label?.length ?? 0) > props.tooltipThreshold
})
</script>

<style scoped>
.tag-chip {
  font-weight: 500;
}
</style>
