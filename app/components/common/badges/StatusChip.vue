<template>
  <UChip
    :color="chipMeta.color"
    :variant="variant"
    :size="size"
    class="status-chip inline-flex items-center gap-1"
    v-bind="$attrs"
  >
    <template v-if="showIcon && chipMeta.icon" #leading>
      <UIcon :name="chipMeta.icon" class="text-xs" aria-hidden="true" />
    </template>
    <slot>
      {{ chipMeta.label }}
    </slot>
  </UChip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'

type Status = 'draft' | 'review' | 'approved' | 'archived'

const props = withDefaults(
  defineProps<{
    status: Status | string
    size?: 'xs' | 'sm'
    variant?: 'soft' | 'subtle'
    showIcon?: boolean
  }>(),
  {
    size: 'xs',
    variant: 'soft',
    showIcon: true,
  },
)

const { t } = useI18n()

const statusKey = computed<Status | 'unknown'>(() => {
  const normalized = String(props.status || '').toLowerCase() as Status
  if (['draft', 'review', 'approved', 'archived'].includes(normalized)) return normalized
  return 'unknown'
})

const chipMeta = computed(() => {
  const map: Record<Status | 'unknown', { color: string; label: string; icon?: string }> = {
    draft: {
      color: 'neutral',
      label: translate('ui.status.draft', 'Draft'),
      icon: 'i-heroicons-pencil-square',
    },
    review: {
      color: 'warning',
      label: translate('ui.status.review', 'In review'),
      icon: 'i-heroicons-eye',
    },
    approved: {
      color: 'success',
      label: translate('ui.status.approved', 'Approved'),
      icon: 'i-heroicons-check-circle',
    },
    archived: {
      color: 'neutral',
      label: translate('ui.status.archived', 'Archived'),
      icon: 'i-heroicons-archive-box',
    },
    unknown: {
      color: 'neutral',
      label: props.status ? props.status : translate('ui.status.unknown', 'Unknown'),
      icon: undefined,
    },
  }

  return map[statusKey.value]
})

const showIcon = computed(() => props.showIcon)

function translate(key: string, fallback: string) {
  const translated = t(key) as string
  return translated === key ? fallback : translated
}
</script>

<style scoped>
.status-chip {
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
}
</style>
