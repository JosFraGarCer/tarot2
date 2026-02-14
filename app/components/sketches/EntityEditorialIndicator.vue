<!--
  components/sketches/EntityEditorialIndicator.vue
  Unified editorial health indicator — replaces the old EntityEditorialIndicator.

  Shows 5 health dimensions:
  1. Editorial status badge
  2. Version + release stage
  3. Per-lang translation dots
  4. Health icons (image, effects, dependencies)
  5. Blockers count + next action

  Modes:
  - full (default): all dimensions visible
  - compact: icon-only status, no labels, no next action
  - minimal: just status dot + blocker count (for map nodes)

  INTEGRATION:
  - Promote to /components/common/EntityHealthIndicator.vue
  - Use in ManageTableBridge, EntityCards, EntitySlideover, Studio, Board cards, Map
-->
<script setup lang="ts">
import {
  editorialStatusMeta,
  translationStatusDot,
  releaseStageDot,
  releaseStageLabel,
  type ReleaseStage,
  type TranslationLangState,
} from '~/components/sketches/mockData'

export interface TranslationCoverage {
  current: number
  total: number
}

export interface EditorialStateInput {
  status: string
  updated_by?: string | null
  updated_at?: string | null
  content_version_id?: number | null
}

export interface HealthFlags {
  hasImage?: boolean
  hasEffects?: boolean
  dependencyHealth?: 'ok' | 'warning' | 'blocked' | null
}

const props = withDefaults(defineProps<{
  editorialState: EditorialStateInput | null
  translationCoverage?: TranslationCoverage | null
  translations?: TranslationLangState[] | null
  nextAction?: string | null
  compact?: boolean
  minimal?: boolean
  versionSemver?: string | null
  releaseStage?: ReleaseStage | null
  blockingReasons?: string[]
  publishReady?: boolean
  health?: HealthFlags | null
}>(), {
  translationCoverage: null,
  translations: null,
  nextAction: null,
  compact: false,
  minimal: false,
  versionSemver: null,
  releaseStage: null,
  blockingReasons: () => [],
  publishReady: false,
  health: null,
})

const statusMeta = computed(() => {
  if (!props.editorialState) return null
  return editorialStatusMeta(props.editorialState.status)
})

const coverageColor = computed<'success' | 'warning' | 'error'>(() => {
  const cov = props.translationCoverage
  if (!cov || cov.total === 0) return 'warning'
  if (cov.current === cov.total) return 'success'
  if (cov.current === 0) return 'error'
  return 'warning'
})

const coverageLabel = computed(() => {
  const cov = props.translationCoverage
  if (!cov) return null
  return `${cov.current}/${cov.total}`
})

const blockersCount = computed(() => props.blockingReasons.length)

const depIcon = computed(() => {
  const h = props.health
  if (!h || h.dependencyHealth === null || h.dependencyHealth === undefined) return null
  if (h.dependencyHealth === 'ok') return { icon: 'i-lucide-git-branch', cls: 'text-emerald-500' }
  if (h.dependencyHealth === 'warning') return { icon: 'i-lucide-git-branch', cls: 'text-amber-400' }
  return { icon: 'i-lucide-git-branch', cls: 'text-red-500' }
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
  if (props.translationCoverage) {
    const { current, total } = props.translationCoverage
    parts.push(`Translations: ${current} of ${total} complete`)
  }
  if (blockersCount.value > 0) {
    parts.push(`${blockersCount.value} blocker${blockersCount.value > 1 ? 's' : ''}`)
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
      <!-- === MINIMAL MODE === -->
      <template v-if="minimal">
        <span
          v-if="statusMeta"
          class="inline-block w-2.5 h-2.5 rounded-full"
          :class="statusMeta.color === 'success' ? 'bg-emerald-500' : statusMeta.color === 'warning' ? 'bg-amber-400' : statusMeta.color === 'error' ? 'bg-red-500' : statusMeta.color === 'primary' ? 'bg-indigo-400' : 'bg-neutral-400'"
          :title="statusMeta.label"
        />
        <span
          v-if="blockersCount > 0"
          class="text-[10px] text-warning font-medium"
          :title="blockingReasons.join('\n')"
        >
          {{ blockersCount }}
        </span>
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
        <template v-if="versionSemver && !compact">
          <UBadge color="neutral" variant="outline" size="xs">
            v{{ versionSemver }}
          </UBadge>
          <span
            v-if="releaseStage"
            :class="`inline-block w-2 h-2 rounded-full shrink-0 ${releaseStageDot(releaseStage)}`"
            :title="releaseStageLabel(releaseStage)"
          />
        </template>

        <!-- Per-lang translation dots (if translations provided) -->
        <div v-if="translations && translations.length" class="flex items-center gap-0.5">
          <span
            v-for="t in translations"
            :key="t.lang"
            class="flex items-center gap-0.5"
            :title="t.has_translation && !t.is_fallback ? `${t.lang.toUpperCase()}: ${translationStatusDot(t.status).label}${t.updated_by ? ` · ${t.updated_by}` : ''}` : `${t.lang.toUpperCase()}: missing`"
          >
            <span :class="`inline-block w-1.5 h-1.5 rounded-full ${translationStatusDot(t.status).dot}`" />
            <span v-if="!compact" class="text-[10px] text-muted">{{ t.lang.toUpperCase() }}</span>
          </span>
        </div>
        <!-- Fallback: coverage badge if no per-lang data -->
        <UBadge
          v-else-if="coverageLabel"
          :color="coverageColor"
          variant="soft"
          :size="compact ? 'xs' : 'sm'"
          icon="i-lucide-languages"
          :aria-label="`Translations: ${translationCoverage!.current} of ${translationCoverage!.total} complete`"
        >
          {{ coverageLabel }}
        </UBadge>

        <!-- Health icons -->
        <div v-if="health" class="flex items-center gap-1">
          <UIcon
            v-if="health.hasImage !== undefined"
            :name="health.hasImage ? 'i-lucide-image' : 'i-lucide-image-off'"
            :class="health.hasImage ? 'text-emerald-500' : 'text-red-500'"
            class="text-xs"
            :title="health.hasImage ? 'Image assigned' : 'No image'"
          />
          <UIcon
            v-if="health.hasEffects !== undefined"
            :name="health.hasEffects ? 'i-lucide-zap' : 'i-lucide-zap-off'"
            :class="health.hasEffects ? 'text-emerald-500' : 'text-red-500'"
            class="text-xs"
            :title="health.hasEffects ? 'Effects defined' : 'No effects'"
          />
          <UIcon
            v-if="depIcon"
            :name="depIcon.icon"
            :class="depIcon.cls"
            class="text-xs"
            :title="health.dependencyHealth === 'ok' ? 'Dependencies OK' : health.dependencyHealth === 'warning' ? 'Dependencies in review' : 'Dependencies blocked'"
          />
        </div>

        <!-- Blockers count -->
        <span
          v-if="blockersCount > 0"
          class="inline-flex items-center gap-0.5 text-[10px] text-warning"
          :title="blockingReasons.join('\n')"
        >
          <UIcon name="i-lucide-alert-triangle" class="text-[10px]" />
          {{ blockersCount }}
        </span>

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
