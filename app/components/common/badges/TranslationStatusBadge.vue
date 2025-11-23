<template>
  <UBadge :color="color" size="xs" :variant="variant" class="min-w-[6rem] justify-center" v-bind="$attrs">
    <slot>
      {{ label }}
    </slot>
  </UBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'
import { getFallbackStatus } from '~/utils/fallbackUtils'

const props = withDefaults(defineProps<{
  isFallback?: boolean | null
  hasTranslation?: boolean | null
  size?: 'xs' | 'sm' | 'md'
}>(), {
  isFallback: null,
  hasTranslation: true,
  size: 'xs',
})

const { t } = useI18n()

const status = computed(() =>
  getFallbackStatus({
    language_code: props.hasTranslation === false ? null : 'lang',
    language_is_fallback: props.isFallback ?? undefined,
  }),
)

const color = computed(() => {
  switch (status.value) {
    case 'missing':
      return 'error'
    case 'partial':
      return 'warning'
    default:
      return 'success'
  }
})

const variant = computed(() => (status.value === 'partial' ? 'soft' : 'subtle'))

const label = computed(() => {
  switch (status.value) {
    case 'missing':
      return tt('ui.translation.missing', 'Missing translation')
    case 'partial':
      return tt('ui.translation.partialFallback', 'Partial (fallback)')
    default:
      return tt('ui.translation.complete', 'Complete')
  }
})

function tt(key: string, fallback: string): string {
  const translated = t(key) as string
  return translated === key ? fallback : translated
}
</script>
