<!--
  components/sketches/EntityEditorialIndicator.vue
  Focused editorial state indicator.

  Shows ONLY:
  1. Editorial status badge
  2. Version + release stage dot
  3. Primary allowed transition (next action)

  Does NOT show (use separate components):
  - Translation coverage → use TranslationCoverageIndicator
  - Health icons (image, effects) → use EntityHealthIcons
  - Dependency health → use DependencyHealthBadge
  - Blocker details → use BlockersList

  Modes:
  - full (default): status label + version + next action
  - compact: icon-only status + version
  - minimal: just status dot (for map nodes)

  INTEGRATION:
  - Promote to /components/common/EntityEditorialIndicator.vue
  - Use in ManageTableBridge, EntityCards, EntitySlideover, Studio, Board cards, Map
-->
<script setup lang="ts">
import {
  editorialStatusMeta,
  releaseStageDot,
  releaseStageLabel,
  type ReleaseStage,
} from '~/components/sketches/mockData'

export interface EditorialStateInput {
  status: string
  updated_by?: string | null
  updated_at?: string | null
  content_version_id?: number | null
}

const props = withDefaults(defineProps<{
  editorialState: EditorialStateInput | null
  nextAction?: string | null
  compact?: boolean
  minimal?: boolean
  versionSemver?: string | null
  releaseStage?: ReleaseStage | null
  publishReady?: boolean
}>(), {
  nextAction: null,
  compact: false,
  minimal: false,
  versionSemver: null,
  releaseStage: null,
  publishReady: false,
})

const statusMeta = computed(() => {
  if (!props.editorialState) return null
  return editorialStatusMeta(props.editorialState.status)
})

const ariaDescription = computed(() => {
  const parts: string[] = []
  if (!props.editorialState) {
    parts.push('Editorial state: not initialized')
  } else if (statusMeta.value) {
    parts.push(`Editorial status: ${statusMeta.value.label}`)
  }
  if (props.versionSemver) {
    parts.push(`Version: ${props.versionSemver}`)
  }
  if (props.releaseStage) {
    parts.push(`Stage: ${releaseStageLabel(props.releaseStage)}`)
  }
  if (props.nextAction) {
    parts.push(`Next action: ${props.nextAction}`)
  }
  return parts.join('. ')
})
</script>

<template>
  <div
    class="inline-flex items-center gap-1.5 flex-wrap"
    :aria-label="ariaDescription"
    role="status"
  >
    <!-- Null / not initialized -->
    <UBadge
      v-if="!editorialState"
      color="neutral"
      variant="subtle"
      :size="compact || minimal ? 'xs' : 'sm'"
      icon="i-lucide-circle-dashed"
      aria-label="Editorial state: not initialized"
    >
      <template v-if="!compact && !minimal">
        Not initialized
      </template>
    </UBadge>

    <template v-else>
      <!-- === MINIMAL MODE (map nodes) === -->
      <template v-if="minimal">
        <span
          v-if="statusMeta"
          class="inline-block w-2.5 h-2.5 rounded-full"
          :class="statusMeta.color === 'success' ? 'bg-emerald-500' : statusMeta.color === 'warning' ? 'bg-amber-400' : statusMeta.color === 'error' ? 'bg-red-500' : statusMeta.color === 'primary' ? 'bg-indigo-400' : 'bg-neutral-400'"
          :title="statusMeta.label"
        />
      </template>

      <!-- === COMPACT / FULL MODE === -->
      <template v-else>
        <!-- Status badge -->
        <UBadge
          v-if="statusMeta"
          :color="statusMeta.color"
          :variant="statusMeta.variant"
          :icon="statusMeta.icon"
          :size="compact ? 'xs' : 'sm'"
          :aria-label="`Status: ${statusMeta.label}`"
        >
          <template v-if="!compact">
            {{ statusMeta.label }}
          </template>
        </UBadge>

        <!-- Version + release stage -->
        <template v-if="versionSemver">
          <UBadge color="neutral" variant="outline" size="xs">
            v{{ versionSemver }}
          </UBadge>
          <span
            v-if="releaseStage"
            :class="`inline-block w-2 h-2 rounded-full shrink-0 ${releaseStageDot(releaseStage)}`"
            :title="releaseStageLabel(releaseStage)"
          />
        </template>

        <!-- Publish ready indicator -->
        <UIcon
          v-if="publishReady"
          name="i-lucide-rocket"
          class="text-xs text-emerald-500"
          title="Ready to publish"
        />

        <!-- Next action hint -->
        <span
          v-if="nextAction && !compact"
          class="text-[11px] text-muted inline-flex items-center gap-0.5"
          :aria-label="`Next action: ${nextAction}`"
        >
          <UIcon name="i-lucide-arrow-right" class="text-[11px]" />
          {{ nextAction }}
        </span>
      </template>
    </template>
  </div>
</template>
