<!-- app/components/common/EntitySummary.vue -->
<template>
  <UCard :ui="cardUi" class="entity-summary" v-bind="$attrs">
    <div class="flex flex-col gap-2">
      <header class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <slot name="title" :title="title" :subtitle="subtitle">
            <h3 v-if="title" class="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {{ title }}
            </h3>
            <p v-if="subtitle" class="truncate text-xs text-neutral-500 dark:text-neutral-400">
              {{ subtitle }}
            </p>
          </slot>
        </div>

        <div class="flex flex-wrap justify-end gap-1.5">
          <slot
            name="badges"
            :status="status"
            :release-stage="releaseStage"
            :translation-status="translationMeta"
            :language="languageDisplay"
          >
            <StatusBadge
              v-if="showTranslationBadge"
              type="translation"
              :value="translationMeta?.status ?? null"
              size="xs"
            />
            <StatusBadge
              v-if="showStatusBadge"
              type="status"
              :value="typeof status === 'string' ? status : null"
              size="xs"
            />
            <StatusBadge
              v-if="showReleaseBadge"
              type="release"
              :value="typeof releaseStage === 'string' ? releaseStage : null"
              size="xs"
            />
            <UBadge
              v-if="showLanguageBadge"
              size="xs"
              variant="subtle"
              color="neutral"
            >
              {{ languageDisplay }}
            </UBadge>
          </slot>
        </div>
      </header>

      <div v-if="hasPreviewSlot && allowPreview" class="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
        <slot name="preview" />
      </div>

      <p v-if="description" class="line-clamp-3 text-sm text-neutral-600 dark:text-neutral-300">
        {{ description }}
      </p>

      <div v-if="normalizedTags.length && allowTags" class="flex flex-wrap gap-1.5">
        <TagChip
          v-for="(tag, index) in normalizedTags"
          :key="`${tag.label}-${index}`"
          :label="tag.label"
          :color="tag.color"
          :variant="tag.variant"
          :size="tag.size"
          :icon="tag.icon"
          :tooltip="tag.tooltip"
          :tooltip-threshold="tag.tooltipThreshold"
        />
      </div>

      <section v-if="metadataItems.length" class="grid gap-2" role="list">
        <div
          v-for="(item, index) in metadataItems"
          :key="`${item.label}-${index}`"
          class="flex items-start justify-between gap-3"
          role="listitem"
        >
          <div class="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            <UIcon v-if="item.icon" :name="item.icon" class="h-3.5 w-3.5" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </div>
          <p class="max-w-[60%] truncate text-xs text-neutral-700 dark:text-neutral-300" :title="item.display">
            {{ item.display }}
          </p>
        </div>
      </section>

      <slot name="meta" />
    </div>

    <template #footer>
      <slot name="footer" />
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useI18n } from '#imports'
import StatusBadge from '~/components/common/StatusBadge.vue'
import TagChip from '~/components/common/badges/TagChip.vue'
import {
  type ReleaseStage,
  type StatusCode,
  type TagInput,
  type EntityMetadataItem,
  type EntityTranslationStatus,
  normalizeTags,
  toMetadataDisplay,
} from '~/components/common/entityDisplay'
import { useEntityCapabilities, type EntityCapabilities } from '~/composables/common/useEntityCapabilities'
import { getFallbackStatus, isFallbackField } from '~/utils/fallbackUtils'

const props = withDefaults(
  defineProps<{
    title?: string | null
    subtitle?: string | null
    description?: string | null
    status?: StatusCode | string | null
    releaseStage?: ReleaseStage | null
    translationStatus?: EntityTranslationStatus | null
    resolvedLang?: string | null
    fallbackLang?: string | null
    tags?: TagInput[] | null
    metadata?: EntityMetadataItem[] | null
    entityKind?: string | null
    capabilities?: Partial<EntityCapabilities> | null
  }>(),
  {
    title: null,
    subtitle: null,
    description: null,
    status: null,
    releaseStage: null,
    translationStatus: null,
    resolvedLang: null,
    fallbackLang: null,
    tags: () => [],
    metadata: () => [],
    entityKind: null,
    capabilities: null,
  },
)

const slots = useSlots()
const { locale, t } = useI18n()

const capabilities = useEntityCapabilities({
  kind: () => props.entityKind ?? null,
  overrides: () => props.capabilities ?? null,
})

const allowTranslation = computed(() => capabilities.value.translatable !== false)
const allowTags = computed(() => capabilities.value.hasTags !== false)
const allowStatus = computed(() => capabilities.value.hasStatus !== false)
const allowRelease = computed(() => capabilities.value.hasReleaseStage !== false)
const allowLanguage = computed(() => capabilities.value.hasLanguage !== false)
const allowPreview = computed(() => capabilities.value.hasPreview !== false)

const translationMeta = computed<EntityTranslationStatus | null>(() => {
  const base = props.translationStatus ?? {}
  const hasBaseValues = Object.keys(base).length > 0

  const resolved = (props.resolvedLang ?? '').trim()
  const requested = (props.fallbackLang ?? '').trim()

  if (!hasBaseValues && !resolved && !requested) {
    return null
  }

  const baseRecord = base as Record<string, any>
  const resolvedCandidate = resolved || String(baseRecord.language_code_resolved ?? baseRecord.language_code ?? '')
  const translationPresent = base.hasTranslation ?? Boolean(resolvedCandidate)

  const fallbackDetected =
    base.isFallback ??
    (resolved && requested ? isFallbackField(resolved, requested) : undefined)

  const status = base.status ?? getFallbackStatus({
    language_code: translationPresent ? (resolvedCandidate || '__present__') : null,
    language_code_resolved: translationPresent ? (resolvedCandidate || '__present__') : null,
    language_is_fallback: fallbackDetected,
  })

  return {
    ...base,
    status,
    hasTranslation: translationPresent,
    isFallback: fallbackDetected ?? status === 'partial',
  }
})

const showTranslationBadge = computed(() => allowTranslation.value && Boolean(translationMeta.value?.status))
const showStatusBadge = computed(() => allowStatus.value && !!props.status)
const showReleaseBadge = computed(() => allowRelease.value && !!props.releaseStage)

const languageDisplay = computed(() => {
  const resolved = props.resolvedLang || ''
  const fallback = props.fallbackLang || ''
  if (!resolved && !fallback) return null
  if (resolved && fallback && resolved.toLowerCase() !== fallback.toLowerCase()) {
    return `${resolved.toUpperCase()} · ${fallback.toUpperCase()}`
  }
  return (resolved || fallback).toUpperCase()
})

const showLanguageBadge = computed(() => allowLanguage.value && Boolean(languageDisplay.value))

const normalizedTags = computed(() => (allowTags.value ? normalizeTags(props.tags ?? []) : []))

const metadataItems = computed(() =>
  toMetadataDisplay(props.metadata, locale.value).map((item) => {
    if (typeof item.value === 'boolean') {
      return {
        ...item,
        display: item.value ? tt('ui.states.enabled', 'Enabled') : tt('ui.states.disabled', 'Disabled'),
      }
    }
    return item
  }),
)

const hasPreviewSlot = computed(() => Boolean(slots.preview))

const cardUi = computed(() => ({
  body: 'p-4 flex flex-col gap-3',
  footer: slots.footer ? 'p-3 border-t border-neutral-200 dark:border-neutral-700' : 'hidden',
}))

function tt(key: string, fallback: string): string {
  const translated = t(key) as string
  return translated === key ? fallback : translated
}
</script>

<style scoped>
.entity-summary :deep(.u-chip) {
  font-weight: 600;
}
</style>
