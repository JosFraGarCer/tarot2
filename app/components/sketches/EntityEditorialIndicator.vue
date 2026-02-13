<!--
  components/sketches/EntityEditorialIndicator.vue
  Reusable editorial health indicator with a clean, integration-ready prop API.

  Props:
  - editorial_state: { status, updated_by, updated_at } | null
  - translation_coverage: { current: number, total: number }
  - next_action?: string (label of the next suggested editorial transition)
  - compact?: boolean (icon-only status badge, no next_action hint)

  Render: [draft ●] [2/3 langs] [→ review]
  Degradation: editorial_state=null → "Not initialized" without breaking layout.
  Accessible: full aria-label on root, per-badge aria-labels.

  INTEGRATION:
  - Promote to /components/common/EntityEditorialIndicator.vue
  - Use in ManageTableBridge cell slots, EntityCards header, EntitySlideover header, dashboard items
  - editorial_state comes from API LIST response (eager-loaded)
  - translation_coverage computed from translation_state or translations array
  - next_action computed from editorial.allowedTransitions[0] (detail) or EDITORIAL_TRANSITIONS map (list)
-->
<script setup lang="ts">
import { editorialStatusMeta } from '~/components/sketches/mockData'

export interface TranslationCoverage {
  current: number
  total: number
}

export interface EditorialStateInput {
  status: string
  updated_by?: string | null
  updated_at?: string | null
}

const props = defineProps<{
  editorialState: EditorialStateInput | null
  translationCoverage?: TranslationCoverage | null
  nextAction?: string | null
  compact?: boolean
}>()

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

const ariaDescription = computed(() => {
  const parts: string[] = []
  if (!props.editorialState) {
    parts.push('Editorial state: not initialized')
  } else if (statusMeta.value) {
    parts.push(`Editorial status: ${statusMeta.value.label}`)
  }
  if (props.translationCoverage) {
    const { current, total } = props.translationCoverage
    parts.push(`Translations: ${current} of ${total} complete`)
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
      :size="compact ? 'xs' : 'sm'"
      icon="i-lucide-circle-dashed"
      aria-label="Editorial state: not initialized"
    >
      <template v-if="!compact">
        Not initialized
      </template>
    </UBadge>

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

      <!-- Translation coverage -->
      <UBadge
        v-if="coverageLabel"
        :color="coverageColor"
        variant="soft"
        :size="compact ? 'xs' : 'sm'"
        icon="i-lucide-languages"
        :aria-label="`Translations: ${translationCoverage!.current} of ${translationCoverage!.total} complete`"
      >
        {{ coverageLabel }}
      </UBadge>

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
  </div>
</template>
