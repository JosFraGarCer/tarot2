<!-- app/components/common/EntityEditorialIndicator.vue
  Production editorial state indicator.

  Shows:
  1. Editorial status badge (via StatusBadge)
  2. Version + release stage
  3. Primary allowed transition (next action hint)
  4. Publish-ready indicator

  Modes:
  - full (default): status label + version + next action
  - compact: icon-only status + version
  - minimal: just status dot (for map nodes)

  Uses real types from shared/editorial and shared/schemas/content-version.
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { CardStatus } from '~~/shared/editorial/card-status'
import { cardStatusTransitions } from '~~/shared/editorial/transitions'
import type { ReleaseStage } from '~~/shared/schemas/content-version'
import { statusColor, releaseColor } from '~/utils/badges'

export interface EditorialStateInput {
  status: CardStatus | string
  updated_by?: string | null
  updated_at?: string | null
  content_version_id?: number | null
}

const props = withDefaults(defineProps<{
  editorialState: EditorialStateInput | null
  allowedTransitions?: CardStatus[]
  compact?: boolean
  minimal?: boolean
  versionSemver?: string | null
  releaseStage?: ReleaseStage | null
  publishReady?: boolean
}>(), {
  allowedTransitions: () => [],
  compact: false,
  minimal: false,
  versionSemver: null,
  releaseStage: null,
  publishReady: false,
})

const statusMeta = computed(() => {
  if (!props.editorialState) return null
  return statusColor(props.editorialState.status)
})

const releaseMeta = computed(() => {
  if (!props.releaseStage) return null
  return releaseColor(props.releaseStage)
})

const nextAction = computed<string | null>(() => {
  if (!props.editorialState) return null
  if (props.allowedTransitions.length > 0) {
    const first = props.allowedTransitions[0]
    if (first) {
      const meta = statusColor(first)
      return meta.fallbackLabel ?? first
    }
  }
  const status = props.editorialState.status as CardStatus
  const transitions = cardStatusTransitions[status]
  if (transitions && transitions.length > 0) {
    const first = transitions[0]
    if (first) {
      const meta = statusColor(first)
      return meta.fallbackLabel ?? first
    }
  }
  return null
})

const ariaDescription = computed(() => {
  const parts: string[] = []
  if (!props.editorialState) {
    parts.push('Editorial state: not initialized')
  } else if (statusMeta.value) {
    parts.push(`Editorial status: ${statusMeta.value.fallbackLabel}`)
  }
  if (props.versionSemver) {
    parts.push(`Version: ${props.versionSemver}`)
  }
  if (releaseMeta.value) {
    parts.push(`Stage: ${releaseMeta.value.fallbackLabel}`)
  }
  if (nextAction.value) {
    parts.push(`Next action: ${nextAction.value}`)
  }
  return parts.join('. ')
})

const statusDotClass = computed(() => {
  if (!statusMeta.value) return 'bg-neutral-400'
  const c = statusMeta.value.color
  if (c === 'success') return 'bg-emerald-500'
  if (c === 'warning') return 'bg-amber-400'
  if (c === 'error') return 'bg-red-500'
  if (c === 'primary') return 'bg-indigo-400'
  return 'bg-neutral-400'
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
          :class="statusDotClass"
          :title="statusMeta.fallbackLabel"
        />
      </template>

      <!-- === COMPACT / FULL MODE === -->
      <template v-else>
        <!-- Status badge -->
        <StatusBadge
          v-if="statusMeta"
          type="status"
          :value="editorialState.status"
          :size="compact ? 'xs' : 'sm'"
          :aria-label="`Status: ${statusMeta.fallbackLabel}`"
        />

        <!-- Version + release stage -->
        <template v-if="versionSemver">
          <UBadge color="neutral" variant="outline" size="xs">
            v{{ versionSemver }}
          </UBadge>
          <span
            v-if="releaseStage && releaseMeta"
            class="inline-block w-2 h-2 rounded-full shrink-0"
            :class="releaseDotClass"
            :title="releaseMeta.fallbackLabel"
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
