<!-- app/components/common/StatusBadge.vue -->
<template>
  <UBadge
    v-if="renderable"
    :size="size"
    :color="color"
    :variant="variant"
    class="inline-flex items-center gap-1"
    :aria-label="ariaLabel"
    v-bind="$attrs"
  >
    <UIcon v-if="icon" :name="icon" class="h-3.5 w-3.5" aria-hidden="true" />
    <slot>
      {{ label }}
    </slot>
  </UBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'
import { statusColor, releaseColor, translationStatusColor, userStatusColor } from '@/utils/badges'

type BadgeType = 'status' | 'release' | 'translation' | 'user'
type BadgeSize = 'xs' | 'sm'
type BadgeColor = 'neutral' | 'primary' | 'success' | 'warning' | 'error'

const resolverMap: Record<BadgeType, (value?: string | null) => ReturnType<typeof statusColor>> = {
  status: statusColor,
  release: releaseColor,
  translation: translationStatusColor,
  user: userStatusColor,
}

const props = withDefaults(defineProps<{
  type?: BadgeType
  value?: string | null
  size?: BadgeSize
  colorOverride?: BadgeColor
}>(), {
  type: 'status',
  size: 'xs',
})

const { t } = useI18n()

const meta = computed(() => resolverMap[props.type](props.value))

const color = computed<BadgeColor>(() => props.colorOverride ?? meta.value.color)
const variant = computed(() => meta.value.variant)
const icon = computed(() => meta.value.icon ?? null)

const label = computed(() => {
  if (meta.value.labelKey) {
    const translated = t(meta.value.labelKey) as string
    if (translated && translated !== meta.value.labelKey) return translated
  }
  return meta.value.fallbackLabel ?? (props.value ?? '')
})

const ariaLabel = computed(() => label.value || props.value || '—')

const renderable = computed(() => Boolean(label.value?.trim?.().length))

defineOptions({ inheritAttrs: false })

defineExpose({ meta })
</script>
