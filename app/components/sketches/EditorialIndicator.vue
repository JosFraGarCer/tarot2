<!--
  components/sketches/EditorialIndicator.vue
  Reusable editorial health indicator component.

  Renders: [status dot] [translation fraction] [next action hint]
  Gracefully degrades when editorial_state is null.

  INTEGRATION:
  - Use in table cells, card headers, slideover headers, dashboard items
  - Replace StatusBadge for editorial-specific contexts
  - Consumes editorial_state (from list) and editorial (from detail, optional)
-->
<script setup lang="ts">
import {
  editorialStatusMeta,
  translationCoverage,
  EDITORIAL_TRANSITIONS,
  type EditorialState,
  type EditorialMetadata,
  type TranslationLangState,
  type EditorialStatus,
} from '~/components/sketches/mockData'

const props = defineProps<{
  editorialState: EditorialState | null
  editorial?: EditorialMetadata | null
  translations?: TranslationLangState[]
  compact?: boolean
}>()

const statusMeta = computed(() => {
  if (!props.editorialState) return null
  return editorialStatusMeta(props.editorialState.status)
})

const coverage = computed(() => {
  if (!props.translations?.length) return null
  return translationCoverage(props.translations)
})

const nextAction = computed(() => {
  if (!props.editorialState) return null
  const transitions = props.editorial?.allowedTransitions ?? EDITORIAL_TRANSITIONS[props.editorialState.status] ?? []
  if (!transitions.length) return null
  const next = transitions[0] as EditorialStatus
  return editorialStatusMeta(next)
})

const ariaDescription = computed(() => {
  const parts: string[] = []
  if (statusMeta.value) parts.push(`Editorial status: ${statusMeta.value.label}`)
  if (coverage.value) {
    parts.push(`Translations: ${coverage.value.label}`)
    if (coverage.value.missing.length) parts.push(`Missing: ${coverage.value.missing.join(', ')}`)
  }
  if (nextAction.value) parts.push(`Next action: ${nextAction.value.label}`)
  return parts.join('. ')
})
</script>

<template>
  <div
    class="inline-flex items-center gap-1.5 flex-wrap"
    :aria-label="ariaDescription"
    role="status"
  >
    <!-- No state -->
    <span v-if="!editorialState" class="text-xs text-muted italic">
      No editorial state
    </span>

    <template v-else>
      <!-- Status dot + label -->
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

      <!-- Translation fraction -->
      <UBadge
        v-if="coverage"
        :color="coverage.done === coverage.total ? 'success' : coverage.done === 0 ? 'error' : 'warning'"
        variant="soft"
        :size="compact ? 'xs' : 'sm'"
        :aria-label="`${coverage.label} translations complete${coverage.missing.length ? '. Missing: ' + coverage.missing.join(', ') : ''}`"
        :title="coverage.missing.length ? `Missing: ${coverage.missing.join(', ')}` : 'All translations complete'"
      >
        {{ coverage.label }}
      </UBadge>

      <!-- Next action hint -->
      <span
        v-if="nextAction && !compact"
        class="text-[10px] text-muted flex items-center gap-0.5"
        :title="`Next: ${nextAction.label}`"
      >
        <UIcon name="i-lucide-arrow-right" class="text-[10px]" />
        {{ nextAction.label }}
      </span>
    </template>
  </div>
</template>
