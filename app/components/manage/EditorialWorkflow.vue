<!-- app/components/manage/EditorialWorkflow.vue -->
<template>
  <div v-if="editorial" class="space-y-3">
    <!-- Current status -->
    <div class="flex items-center gap-2">
      <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {{ tt('ui.editorial.currentStatus', 'Status') }}
      </span>
      <UBadge
        :color="currentMeta.color"
        :variant="currentMeta.variant"
        size="md"
      >
        {{ t(currentMeta.labelKey) }}
      </UBadge>
    </div>

    <!-- Publish readiness warning -->
    <UAlert
      v-if="editorial.publishReady === false && editorial.blockingReasons?.length"
      color="warning"
      icon="i-heroicons-exclamation-triangle"
      :title="tt('ui.editorial.notPublishReady', 'Not ready to publish')"
      :description="editorial.blockingReasons.join('. ')"
      variant="subtle"
      class="text-xs"
    />

    <!-- Transition actions — only shows backend-allowed transitions (v-can as defense-in-depth) -->
    <div v-if="allowedTransitionButtons.length" v-can="['canEditContent','canReview','canPublish','canTranslate']" class="flex flex-wrap gap-2">
      <UButton
        v-for="tr in allowedTransitionButtons"
        :key="tr.value"
        :color="tr.buttonColor"
        variant="soft"
        :disabled="transitioning"
        :loading="transitioning && transitionTarget === tr.value"
        size="xs"
        @click="onTransition(tr.value)"
      >
        <template #leading>
          <UIcon name="i-heroicons-arrow-right-circle" class="size-3.5" />
        </template>
        {{ t(tr.labelKey) }}
      </UButton>
    </div>
    <p v-else class="text-xs text-gray-400 dark:text-gray-500 italic">
      {{ tt('ui.editorial.noTransitions', 'No transitions available from this status.') }}
    </p>

    <!-- Transition error -->
    <UAlert
      v-if="transitionError"
      color="error"
      icon="i-heroicons-exclamation-triangle"
      :description="transitionError"
      variant="subtle"
      class="text-xs"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '#imports'
import { useCardStatus } from '~/utils/status'

interface EditorialMeta {
  status: string
  allowedTransitions: string[]
  publishReady: boolean
  blockingReasons: string[]
}

const props = defineProps<{
  editorial: EditorialMeta | null | undefined
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'transition', status: string): void
}>()

const { t, te } = useI18n()
const statusUtil = useCardStatus()

function tt(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}

const transitioning = ref(false)
const transitionTarget = ref<string | null>(null)
const transitionError = ref<string | null>(null)

const currentMeta = computed(() => {
  const status = props.editorial?.status
  return {
    labelKey: statusUtil.labelKey(status as any),
    color: statusUtil.color(status as any),
    variant: statusUtil.variant(status as any),
  }
})

const PIPELINE_ORDER = [
  'draft',
  'pending_review',
  'review',
  'translation_review',
  'changes_requested',
  'approved',
  'published',
  'rejected',
  'archived',
]

const TRANSITION_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  pending_review: 'warning',
  review: 'warning',
  translation_review: 'warning',
  changes_requested: 'warning',
  approved: 'primary',
  published: 'success',
  rejected: 'error',
  archived: 'neutral',
}

// Only show transitions the backend reports as allowed.
// No frontend duplication of transition rules — UI reflects backend truth only.
const allowedTransitionButtons = computed(() => {
  if (!props.editorial) return []
  const allowed = props.editorial.allowedTransitions ?? []
  return allowed
    .slice()
    .sort((a, b) => PIPELINE_ORDER.indexOf(a) - PIPELINE_ORDER.indexOf(b))
    .map(s => ({
      value: s,
      labelKey: statusUtil.labelKey(s as any),
      buttonColor: TRANSITION_COLORS[s] ?? ('primary' as const),
    }))
})

async function onTransition(status: string) {
  if (props.disabled || transitioning.value) return
  transitioning.value = true
  transitionTarget.value = status
  transitionError.value = null
  try {
    emit('transition', status)
  } finally {
    // Parent is responsible for the actual API call and will
    // reset transitioning via the editorial prop update
    setTimeout(() => {
      transitioning.value = false
      transitionTarget.value = null
    }, 300)
  }
}

function setError(message: string) {
  transitionError.value = message
  transitioning.value = false
  transitionTarget.value = null
}

function clearError() {
  transitionError.value = null
}

defineExpose({ setError, clearError })
</script>
