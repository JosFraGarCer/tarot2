<!-- app/components/common/TranslationStatusInline.vue
  Displays translation status as an inline language list.
  Each language shows its code with a color-coded status indicator.
  No circles — uses text color and weight to convey status.

  Uses real FallbackStatus from utils/fallbackUtils for status resolution.
-->
<script setup lang="ts">
import { computed } from 'vue'

export interface TranslationLangStatus {
  lang: string
  hasTranslation: boolean
  isFallback: boolean
}

const props = withDefaults(defineProps<{
  translations: TranslationLangStatus[]
  size?: 'xs' | 'sm'
}>(), {
  size: 'xs',
})

interface ResolvedLang {
  lang: string
  label: string
  status: 'complete' | 'partial' | 'missing'
  colorClass: string
}

const resolved = computed<ResolvedLang[]>(() => {
  return props.translations.map((t) => {
    let status: 'complete' | 'partial' | 'missing'
    if (t.hasTranslation && !t.isFallback) {
      status = 'complete'
    } else if (t.hasTranslation && t.isFallback) {
      status = 'partial'
    } else {
      status = 'missing'
    }

    const colorClass =
      status === 'complete'
        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
        : status === 'partial'
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-muted'

    return {
      lang: t.lang,
      label: t.lang.toUpperCase(),
      status,
      colorClass,
    }
  })
})

const summary = computed(() => {
  const total = props.translations.length
  const complete = resolved.value.filter(r => r.status === 'complete').length
  return { complete, total, label: `${complete}/${total}` }
})

const ariaLabel = computed(() => {
  const parts = resolved.value.map(r => `${r.label}: ${r.status}`)
  return `Translations ${summary.value.label}: ${parts.join(', ')}`
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1"
    :class="size === 'xs' ? 'text-[11px]' : 'text-xs'"
    :aria-label="ariaLabel"
    role="status"
  >
    <span class="text-muted tabular-nums">{{ summary.label }}</span>
    <span class="inline-flex items-center gap-0.5">
      <span
        v-for="r in resolved"
        :key="r.lang"
        :class="r.colorClass"
        :title="`${r.label}: ${r.status}`"
      >{{ r.label }}</span>
    </span>
  </span>
</template>
