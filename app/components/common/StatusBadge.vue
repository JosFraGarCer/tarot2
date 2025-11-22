<template>
  <UBadge
    v-if="shouldRender"
    :size="size"
    :color="resolvedColor"
    :variant="resolvedVariant"
    v-bind="$attrs"
  >
    <slot>
      {{ displayLabel }}
    </slot>
  </UBadge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'
import { useCardStatus } from '~/utils/status'
import { userStatusColor, userStatusVariant, userStatusLabelKey } from '~/utils/userStatus'

const STATUS_KINDS = {
  default: {
    active: { label: 'Active', color: 'success' },
    inactive: { label: 'Inactive', color: 'neutral' },
    pending: { label: 'Pending', color: 'warning' },
    suspended: { label: 'Suspended', color: 'warning' },
    blocked: { label: 'Blocked', color: 'error' },
    banned: { label: 'Banned', color: 'error' },
    archived: { label: 'Archived', color: 'neutral' },
    draft: { label: 'Draft', color: 'neutral' },
    published: { label: 'Published', color: 'success' },
    private: { label: 'Private', color: 'neutral' },
  },
  card: {
    published: { label: 'Published', color: 'success' },
    draft: { label: 'Draft', color: 'warning' },
    review: { label: 'In review', color: 'warning' },
    rejected: { label: 'Rejected', color: 'error' },
    archived: { label: 'Archived', color: 'neutral' },
  },
  feedback: {
    open: { label: 'Open', color: 'warning' },
    resolved: { label: 'Resolved', color: 'success' },
    dismissed: { label: 'Dismissed', color: 'neutral' },
  },
  revision: {
    draft: { label: 'Draft', color: 'neutral' },
    review: { label: 'In review', color: 'warning' },
    published: { label: 'Published', color: 'success' },
    archived: { label: 'Archived', color: 'neutral' },
  },
  user: {
    active: { label: 'Active', color: 'success' },
    inactive: { label: 'Inactive', color: 'neutral' },
    banned: { label: 'Banned', color: 'error' },
    suspended: { label: 'Suspended', color: 'warning' },
    pending: { label: 'Pending', color: 'warning' },
    invited: { label: 'Invited', color: 'info' },
  },
} as const

type BadgeColor = 'neutral' | 'primary' | 'warning' | 'success' | 'error'
type BadgeVariant = 'subtle' | 'soft' | 'outline'
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  status?: string | null
  kind?: 'card' | 'user'
  label?: string
  labelKey?: string
  color?: BadgeColor
  variant?: BadgeVariant
  size?: BadgeSize
  hideWhenEmpty?: boolean
}>(), {
  kind: 'card',
  size: 'sm',
  hideWhenEmpty: true,
})

const { t } = useI18n()
const cardStatus = useCardStatus()
const cardStatusOptions = cardStatus.options()
const cardFallbackLabelKey = cardStatus.labelKey(undefined)
const cardFallbackColor = cardStatus.color(undefined)
const cardFallbackVariant = cardStatus.variant(undefined)

const cardMeta = computed(() => {
  if (props.kind !== 'card' || !props.status) return null
  return cardStatusOptions.find(option => option.value === props.status) ?? null
})

const variant = computed(() => {
  const kind = props.kind ?? (props.statusKind === 'user' ? 'user' : 'default')
  const kindMap = STATUS_KINDS[kind as keyof typeof STATUS_KINDS] ?? STATUS_KINDS.default
  return kindMap[(props.status ?? '').toLowerCase() as keyof typeof kindMap]
})

const resolvedLabelKey = computed(() => {
  if (props.labelKey) return props.labelKey
  if (props.kind === 'user') return userStatusLabelKey(props.status)
  if (variant.value) return variant.value.label
  return cardMeta.value?.labelKey ?? cardFallbackLabelKey
})

const displayLabel = computed(() => {
  if (props.label !== undefined && props.label !== null) return props.label
  if (resolvedLabelKey.value) return t(resolvedLabelKey.value)
  return props.status ? String(props.status) : ''
})

const resolvedColor = computed<BadgeColor>(() => {
  if (props.color) return props.color
  if (props.kind === 'user') return userStatusColor(props.status) as BadgeColor
  return (cardMeta.value?.color ?? cardFallbackColor) as BadgeColor
})

const resolvedVariant = computed<BadgeVariant>(() => {
  if (props.variant) return props.variant
  if (props.kind === 'user') return userStatusVariant(props.status) as BadgeVariant
  return (cardMeta.value?.variant ?? cardFallbackVariant) as BadgeVariant
})

const shouldRender = computed(() => {
  if (!props.hideWhenEmpty) return true
  return Boolean(displayLabel.value && displayLabel.value.length > 0)
})
</script>
