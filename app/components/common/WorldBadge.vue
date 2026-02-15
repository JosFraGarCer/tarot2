<!-- app/components/common/WorldBadge.vue
  Displays a world association badge for entities linked to a specific world.
  Shows world name with globe icon, or "Base System" when no world is assigned.
-->
<script setup lang="ts">
import { computed } from 'vue'

export interface WorldRef {
  id: number
  name: string
}

const props = withDefaults(defineProps<{
  world?: WorldRef | null
  size?: 'xs' | 'sm'
  showBaseSystem?: boolean
}>(), {
  world: null,
  size: 'xs',
  showBaseSystem: true,
})

const label = computed(() => {
  if (props.world) return props.world.name
  return props.showBaseSystem ? 'Base System' : null
})

const ariaLabel = computed(() => {
  if (props.world) return `World: ${props.world.name}`
  return 'Base System (no world)'
})
</script>

<template>
  <UBadge
    v-if="label"
    :color="world ? 'primary' : 'neutral'"
    :variant="world ? 'soft' : 'subtle'"
    :size="size"
    :icon="world ? 'i-lucide-globe' : undefined"
    :aria-label="ariaLabel"
  >
    {{ label }}
  </UBadge>
</template>
