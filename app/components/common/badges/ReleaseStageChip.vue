<template>
  <UChip
    :color="chipMeta.color"
    :variant="chipMeta.variant"
    :size="size"
    class="release-stage-chip"
    :class="{ 'cursor-pointer': clickable }"
    :role="clickable ? 'button' : undefined"
    :aria-pressed="clickable ? 'false' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="handleClick"
    @keyup.enter.prevent="handleClick"
    @keyup.space.prevent="handleClick"
    v-bind="$attrs"
  >
    <slot>
      {{ chipMeta.label }}
    </slot>
  </UChip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'

type ReleaseStage = 'dev' | 'alpha' | 'beta' | 'candidate' | 'release' | 'revision'

const props = withDefaults(
  defineProps<{
    stage: ReleaseStage
    size?: 'xs' | 'sm'
    clickable?: boolean
  }>(),
  {
    size: 'xs',
    clickable: false,
  },
)

const emit = defineEmits<{ (e: 'click', stage: ReleaseStage): void }>()

const { t } = useI18n()

const chipMeta = computed(() => {
  const map: Record<ReleaseStage, { color: string; variant: 'soft' | 'subtle'; label: string }> = {
    dev: {
      color: 'neutral',
      variant: 'soft',
      label: translate('ui.release.dev', 'Development'),
    },
    alpha: {
      color: 'warning',
      variant: 'soft',
      label: translate('ui.release.alpha', 'Alpha'),
    },
    beta: {
      color: 'info',
      variant: 'soft',
      label: translate('ui.release.beta', 'Beta'),
    },
    candidate: {
      color: 'primary',
      variant: 'soft',
      label: translate('ui.release.candidate', 'Release candidate'),
    },
    release: {
      color: 'success',
      variant: 'soft',
      label: translate('ui.release.release', 'Released'),
    },
    revision: {
      color: 'error',
      variant: 'soft',
      label: translate('ui.release.revision', 'Revision required'),
    },
  }

  return map[props.stage] ?? {
    color: 'neutral',
    variant: 'soft',
    label: translate('ui.release.unknown', props.stage ?? '—'),
  }
})

const clickable = computed(() => props.clickable)

function handleClick(event: Event) {
  if (!clickable.value) return
  event.stopPropagation()
  emit('click', props.stage)
}

function translate(key: string, fallback: string): string {
  const translated = t(key) as string
  return translated === key ? fallback : translated
}
</script>

<style scoped>
.release-stage-chip {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}
</style>
