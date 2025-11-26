<template>
  <USlideover
    v-model:open="internalOpen"
    side="right"
    :overlay="true"
    :close="false"
    :ui="slideoverUi"
    :aria-describedby="descriptionId"
    @update:open="value => !value && emitClose()"
  >
    <template #title>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex flex-col gap-1">
          <p v-if="displayId" class="text-xs text-neutral-500 dark:text-neutral-400">
            #{{ displayId }} · {{ resolvedKindLabel }}
          </p>
          <h2 class="truncate text-lg font-semibold leading-tight text-neutral-900 dark:text-neutral-50">
            {{ displayTitle }}
          </h2>
          <p v-if="displaySubtitle" class="truncate text-sm text-neutral-500 dark:text-neutral-400">
            {{ displaySubtitle }}
          </p>
        </div>
        <UButton
          icon="i-heroicons-x-mark"
          size="xs"
          variant="ghost"
          color="neutral"
          :aria-label="tt('ui.actions.close', 'Close preview')"
          @click="emitClose"
        />
      </div>
    </template>

    <template #description>
      <p :id="descriptionId" class="sr-only">
        {{ tt('ui.a11y.entityInspectorDescription', 'Detailed entity inspector panel showing metadata and translations.') }}
      </p>
    </template>

    <template #body>
      <div class="flex h-full flex-col">
        <div class="flex-1 overflow-y-auto">
          <div class="space-y-6 p-4">
            <template v-if="isLoading">
              <USkeleton class="h-32 w-full" />
              <USkeleton class="h-24 w-full" />
              <USkeleton class="h-48 w-full" />
            </template>

            <template v-else>
              <EntitySummary
                :title="displayTitle"
                :subtitle="displaySubtitle"
                :description="displayDescription"
                :status="displayStatus"
                :release-stage="displayReleaseStage"
                :translation-status="summaryTranslationStatus"
                :resolved-lang="resolvedLanguage"
                :fallback-lang="fallbackLanguage"
                :tags="summaryTags"
                :metadata="summaryMetadata"
                :entity-kind="resolvedKind"
                :capabilities="capabilitiesOverrides"
              />

              <section v-if="showTranslations" class="space-y-3">
                <header class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    {{ tt('ui.sections.translations', 'Translations') }}
                  </h3>
                  <UBadge size="xs" color="neutral" variant="subtle">
                    {{ translationItems.length }}
                  </UBadge>
                </header>
                <ul class="space-y-2">
                  <li
                    v-for="item in translationItems"
                    :key="item.key"
                    class="rounded border border-neutral-200 bg-neutral-50 p-3 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <div class="flex flex-wrap items-center gap-2">
                      <UBadge size="xs" color="primary" variant="soft">
                        {{ item.lang }}
                      </UBadge>
                      <span class="font-medium text-neutral-700 dark:text-neutral-200">
                        {{ item.name || tt('ui.common.untitled', 'Untitled') }}
                      </span>
                      <UBadge
                        v-if="item.status"
                        size="xs"
                        color="neutral"
                        variant="outline"
                      >
                        {{ item.status }}
                      </UBadge>
                    </div>
                    <p v-if="item.description" class="mt-2 line-clamp-3 text-neutral-600 dark:text-neutral-300">
                      {{ item.description }}
                    </p>
                  </li>
                </ul>
              </section>

              <section v-if="showTags" class="space-y-2">
                <header class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    {{ tt('ui.fields.tags', 'Tags') }}
                  </h3>
                  <UBadge size="xs" color="neutral" variant="subtle">
                    {{ tagsList.length }}
                  </UBadge>
                </header>
                <div class="flex flex-wrap gap-2">
                  <UBadge v-for="tag in tagsList" :key="tag" size="xs" color="primary" variant="soft">
                    {{ tag }}
                  </UBadge>
                </div>
              </section>

              <section v-if="standardFields.length" class="space-y-2">
                <header>
                  <h3 class="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    {{ tt('ui.sections.metadata', 'Metadata') }}
                  </h3>
                </header>
                <dl class="grid gap-2 text-xs">
                  <div
                    v-for="field in standardFields"
                    :key="field.label"
                    class="flex items-start justify-between gap-3"
                  >
                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">
                      {{ field.label }}
                    </dt>
                    <dd class="max-w-[65%] text-right text-neutral-700 dark:text-neutral-200">
                      {{ field.value }}
                    </dd>
                  </div>
                </dl>
              </section>
            </template>
          </div>
        </div>

        <footer v-if="$slots.actions" class="border-t border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <slot name="actions" :entity="displayEntity" :raw="snapshotEntity" />
        </footer>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useI18n } from '#imports'
import EntitySummary from '~/components/common/EntitySummary.vue'
import type { EntityRow } from '~/components/manage/view/EntityTable.vue'
import { useEntityCapabilities, type EntityCapabilities } from '~/composables/common/useEntityCapabilities'
import { useEntityPreviewFetch, type EntityPreviewOptions } from '~/composables/common/useEntityPreviewFetch'

const props = withDefaults(defineProps<{
  open: boolean
  entity?: EntityRow | null
  rawEntity?: Record<string, any> | null
  kind?: string | null
  capabilities?: Partial<EntityCapabilities> | null
  lang?: string | null
}>(), {
  open: false,
  entity: null,
  rawEntity: null,
  kind: null,
  capabilities: null,
  lang: null,
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const { t } = useI18n()

const internalOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

const resolvedKind = computed(() => props.kind || props.rawEntity?.entity_type || props.rawEntity?.kind || null)

const descriptionId = computed(() => {
  const base = resolvedKind.value ? resolvedKind.value.replace(/[^a-z0-9-]/gi, '-').toLowerCase() : 'entity'
  const idPart = resolvedId.value ?? 'preview'
  return `entity-inspector-description-${base}-${idPart}`
})

function resolveId(): number | null {
  const candidates = [
    props.entity?.id,
    props.rawEntity?.id,
    props.rawEntity?.entity_id,
    props.rawEntity?.base_id,
    props.rawEntity?.uuid,
    props.rawEntity?.code,
  ]

  for (const candidate of candidates) {
    const value = typeof candidate === 'number' ? candidate : Number(candidate)
    if (Number.isFinite(value) && value > 0) {
      return value
    }
  }
  return null
}

const resolvedId = computed(resolveId)

const resolvedLang = computed(() => props.lang || props.entity?.lang || props.rawEntity?.language_code || props.rawEntity?.lang || null)

const previewOptions = reactive<EntityPreviewOptions>({
  kind: resolvedKind.value ?? '',
  id: resolvedId.value,
  lang: resolvedLang.value,
  query: undefined,
  transform: undefined,
  immediate: props.open,
})

watch([resolvedKind, resolvedId, resolvedLang, () => props.open], ([kind, id, lang, open]) => {
  previewOptions.kind = kind ?? ''
  previewOptions.id = id ?? null
  previewOptions.lang = lang ?? null
  previewOptions.immediate = open
})

const { data: previewData, pending: previewPending } = useEntityPreviewFetch(previewOptions)

const snapshotEntity = computed(() => previewData.value ?? props.rawEntity ?? props.entity?.raw ?? null)
const displayEntity = computed(() => props.entity ?? null)

const isLoading = computed(() => previewPending.value && !snapshotEntity.value)

const resolvedCapabilities = useEntityCapabilities({
  kind: () => resolvedKind.value,
  overrides: () => props.capabilities ?? null,
})

const capabilitiesOverrides = computed(() => props.capabilities ?? null)

const displayTitle = computed(() => {
  const primary = displayEntity.value?.name || snapshotEntity.value?.name || snapshotEntity.value?.title
  if (primary) return primary
  if (resolvedId.value) return `#${resolvedId.value}`
  return tt('ui.common.untitled', 'Untitled')
})

const displaySubtitle = computed(() => displayEntity.value?.code || snapshotEntity.value?.code || null)

const displayDescription = computed(() => snapshotEntity.value?.description || snapshotEntity.value?.summary || displayEntity.value?.description || null)

const displayStatus = computed(() => snapshotEntity.value?.status || displayEntity.value?.status || null)

const displayReleaseStage = computed(() => snapshotEntity.value?.release_stage || displayEntity.value?.release_stage || null)

const summaryTranslationStatus = computed(() => snapshotEntity.value?.translationStatus || displayEntity.value?.translationStatus || null)

const resolvedLanguage = computed(() => snapshotEntity.value?.language_code_resolved || snapshotEntity.value?.language_code || displayEntity.value?.lang || null)
const fallbackLanguage = computed(() => snapshotEntity.value?.language_code || null)

const summaryTags = computed(() => {
  if (Array.isArray(snapshotEntity.value?.tags)) return snapshotEntity.value.tags
  const value = displayEntity.value?.tags
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
  }
  if (typeof snapshotEntity.value?.tags === 'string') {
    return snapshotEntity.value.tags
      .split(',')
      .map((tag: string) => tag.trim())
      .filter(Boolean)
  }
  return []
})

const summaryMetadata = computed(() => {
  const metadata: Array<{ label: string; value: string }> = []
  const created = snapshotEntity.value?.created_at || props.rawEntity?.created_at || null
  const updated = snapshotEntity.value?.updated_at || props.rawEntity?.updated_at || null

  if (created) {
    metadata.push({ label: tt('ui.fields.createdAt', 'Created at'), value: formatDate(created) })
  }
  if (updated) {
    metadata.push({ label: tt('ui.fields.updatedAt', 'Updated at'), value: formatDate(updated) })
  }

  if (snapshotEntity.value?.owner_name) {
    metadata.push({ label: tt('ui.fields.owner', 'Owner'), value: String(snapshotEntity.value.owner_name) })
  }

  return metadata
})

const tagsList = computed(() => summaryTags.value.map(tag => String(tag)))

const standardFields = computed(() => {
  const rows: Array<{ label: string; value: string }> = []
  if (displayStatus.value) {
    rows.push({ label: tt('ui.fields.status', 'Status'), value: String(displayStatus.value) })
  }
  if (snapshotEntity.value?.is_active !== undefined) {
    const active = Boolean(snapshotEntity.value.is_active)
    rows.push({
      label: tt('ui.fields.active', 'Active'),
      value: active ? tt('ui.states.enabled', 'Enabled') : tt('ui.states.disabled', 'Disabled'),
    })
  }
  if (resolvedLanguage.value) {
    rows.push({ label: tt('ui.fields.language', 'Language'), value: resolvedLanguage.value.toUpperCase() })
  }
  if (snapshotEntity.value?.author_name) {
    rows.push({ label: tt('ui.fields.author', 'Author'), value: String(snapshotEntity.value.author_name) })
  }
  return rows
})

const translationItems = computed(() => {
  const source = snapshotEntity.value?.translations || props.rawEntity?.translations
  if (!Array.isArray(source)) return []
  return source
    .map((entry: Record<string, any>, index: number) => {
      const lang = entry?.language_code || entry?.lang || `#${index + 1}`
      return {
        key: `${lang}-${index}`,
        lang: String(lang).toUpperCase(),
        name: entry?.name || entry?.title || entry?.label || null,
        description: entry?.description || entry?.summary || null,
        status: entry?.status || entry?.translation_status || null,
      }
    })
    .filter((item) => Boolean(item.lang))
})

const showTranslations = computed(() => {
  if ((resolvedCapabilities.value.hasTranslations ?? resolvedCapabilities.value.translatable) === false) return false
  return translationItems.value.length > 0
})

const showTags = computed(() => {
  if (resolvedCapabilities.value.hasTags === false) return false
  return tagsList.value.length > 0
})

const displayId = computed(() => resolvedId.value)

const resolvedKindLabel = computed(() => {
  if (!resolvedKind.value) return tt('ui.common.entity', 'Entity')
  return resolvedKind.value.replace(/_/g, ' ')
})

const slideoverUi = {
  content: 'w-full max-w-2xl lg:max-w-3xl flex flex-col',
}

function emitClose() {
  emit('update:open', false)
}

function formatDate(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

function tt(key: string, fallback: string): string {
  const translated = t(key) as string
  return translated === key ? fallback : translated
}
</script>
