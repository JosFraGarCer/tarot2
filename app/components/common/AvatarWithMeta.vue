<!-- app/components/common/AvatarWithMeta.vue
  Displays a user avatar (UAvatar) alongside username and an optional date.
  Uses DiceBear initials API for avatar generation.
  Accepts real user data shapes from API responses.
-->
<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  username: string | null | undefined
  date?: string | null
  avatarSrc?: string | null
  size?: '3xs' | '2xs' | 'xs' | 'sm' | 'md'
  dateFormat?: 'relative' | 'short' | 'long'
}>(), {
  date: null,
  avatarSrc: null,
  size: '2xs',
  dateFormat: 'relative',
})

const resolvedSrc = computed(() => {
  if (props.avatarSrc) return props.avatarSrc
  if (!props.username) return undefined
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(props.username)}&radius=50&size=32`
})

const displayName = computed(() => props.username ?? 'Unknown')

const formattedDate = computed(() => {
  if (!props.date) return null
  const d = new Date(props.date)
  if (isNaN(d.getTime())) return null

  if (props.dateFormat === 'relative') {
    return formatRelative(d)
  }
  if (props.dateFormat === 'short') {
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }
  return d.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })
})

function formatRelative(d: Date): string {
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

const ariaLabel = computed(() => {
  const parts = [displayName.value]
  if (formattedDate.value) parts.push(formattedDate.value)
  return parts.join(' · ')
})
</script>

<template>
  <span class="inline-flex items-center gap-1.5" :aria-label="ariaLabel">
    <UAvatar
      :src="resolvedSrc"
      :alt="displayName"
      :size="size"
      class="shrink-0"
    />
    <span class="text-xs text-muted truncate">
      <slot>
        <span class="font-medium">{{ displayName }}</span>
        <template v-if="formattedDate">
          <span class="mx-0.5">·</span>
          <span>{{ formattedDate }}</span>
        </template>
      </slot>
    </span>
  </span>
</template>
