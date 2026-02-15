<!-- app/components/common/VersionBadge.vue
  Displays version semver + release stage dot in a compact badge group.
  Uses real ReleaseStage from shared/schemas/content-version.
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { ReleaseStage } from '~~/shared/schemas/content-version'
import { releaseColor } from '~/utils/badges'

const props = withDefaults(defineProps<{
  versionSemver?: string | null
  releaseStage?: ReleaseStage | null
  size?: 'xs' | 'sm'
}>(), {
  versionSemver: null,
  releaseStage: null,
  size: 'xs',
})

const releaseMeta = computed(() => {
  if (!props.releaseStage) return null
  return releaseColor(props.releaseStage)
})

const releaseDotClass = computed(() => {
  if (!releaseMeta.value) return 'bg-neutral-400'
  const c = releaseMeta.value.color
  if (c === 'success') return 'bg-emerald-500'
  if (c === 'warning') return 'bg-amber-400'
  if (c === 'error') return 'bg-red-500'
  if (c === 'primary') return 'bg-indigo-400'
  return 'bg-neutral-400'
})

const ariaLabel = computed(() => {
  const parts: string[] = []
  if (props.versionSemver) parts.push(`Version ${props.versionSemver}`)
  if (releaseMeta.value) parts.push(`Stage: ${releaseMeta.value.fallbackLabel}`)
  return parts.join(', ') || 'No version'
})
</script>

<template>
  <span
    v-if="versionSemver"
    class="inline-flex items-center gap-1"
    :aria-label="ariaLabel"
  >
    <UBadge color="neutral" variant="outline" :size="size">
      v{{ versionSemver }}
    </UBadge>
    <span
      v-if="releaseStage && releaseMeta"
      class="inline-block w-2 h-2 rounded-full shrink-0"
      :class="releaseDotClass"
      :title="releaseMeta.fallbackLabel"
    />
  </span>
</template>
