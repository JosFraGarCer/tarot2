<!-- app/components/manage/EntitySlideover.vue -->
<template>
  <USlideover
    v-model:open="open"
    side="right"
    :close="false"
    :overlay="false"
    :ui="{ content: 'max-w-3xl w-full lg:max-w-4xl flex flex-col' }"
    @update:open="(value) => !value && handleClose()"
  >
    <template #title>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <UButton
              variant="soft"
              color="neutral"
              size="xs"
              icon="i-heroicons-arrow-left"
              :disabled="!canGoPrev"
              :aria-label="tt('ui.actions.previous', 'Previous')"
              @click="goPrev"
            />
            <UButton
              variant="soft"
              color="neutral"
              size="xs"
              icon="i-heroicons-arrow-right"
              :disabled="!canGoNext"
              :aria-label="tt('ui.actions.next', 'Next')"
              @click="goNext"
            />
          </div>
          <div>
            <div v-if="loading" class="space-y-2">
              <USkeleton class="h-6 w-48" />
              <USkeleton class="h-4 w-28" />
            </div>
            <template v-else>
              <h2 class="text-lg font-semibold leading-tight text-neutral-900 dark:text-neutral-50 truncate">
                {{ headerTitle }}
              </h2>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                #{{ props.id }} · {{ kindLabel }}
              </p>
              <div class="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge
                  v-if="entity.value?.status && capabilities.value.hasStatus"
                  type="status"
                  :value="entity.value.status"
                  size="sm"
                />
                <StatusBadge
                  v-if="entity.value?.release_stage && capabilities.value.hasReleaseStage"
                  type="release"
                  :value="entity.value.release_stage"
                  size="sm"
                />
                <StatusBadge
                  v-if="summaryTranslationStatus?.status"
                  type="translation"
                  :value="summaryTranslationStatus.status"
                />
              </div>
            </template>
          </div>
        </div>
        <UButton
          icon="i-heroicons-x-mark"
          variant="ghost"
          color="neutral"
          aria-label="Close"
          @click="handleClose"
        />
      </div>
    </template>
    <template #body>
        <div class="flex-1 overflow-y-auto">
        <div class="p-4 space-y-6">
            <template v-if="loading">
            <USkeleton class="h-40 w-full" />
            <USkeleton class="h-64 w-full" />
            <USkeleton class="h-64 w-full" />
            </template>

            <template v-else>
            <UAlert
                v-if="errorMessage"
                color="error"
                icon="i-heroicons-exclamation-triangle"
                :title="tt('ui.notifications.error', 'Error')"
                :description="errorMessage"
            />

            <UCard>
                <template #header>
                <div class="flex items-center justify-between gap-2">
                    <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-100">
                    {{ tt('ui.sections.summary', 'Summary') }}
                    </h3>
                </div>
                </template>
                <EntitySummary
                v-if="entity.value"
                :title="entity.value.name || entity.value.code || `#${entity.value.id}`"
                :subtitle="entity.value.code"
                :description="entity.value.short_text"
                :status="entity.value.status"
                :release-stage="entity.value.release_stage ?? null"
                :translation-status="summaryTranslationStatus"
                :resolved-lang="entity.value.language_code_resolved ?? null"
                :fallback-lang="selectedTranslationLang"
                :tags="entity.value.tags ?? []"
                :metadata="summaryMetadata"
                :entity-kind="props.kind"
                :capabilities="capabilities"
                />
            </UCard>

            <UCard>
                <template #header>
                <div class="flex items-center justify-between gap-2">
                    <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-100">
                    {{ tt('ui.sections.basic', 'Basic information') }}
                    </h3>
                    <div class="flex items-center gap-2">
                    <UButton
                        variant="soft"
                        color="neutral"
                        size="xs"
                        :disabled="!basicSection.dirty.value"
                        @click="basicSection.reset"
                    >
                        {{ tt('ui.actions.reset', 'Reset') }}
                    </UButton>
                    <UButton
                        color="primary"
                        size="xs"
                        :disabled="!basicSection.dirty.value"
                        :loading="basicSection.loading.value"
                        @click="saveBasic"
                    >
                        {{ tt('ui.actions.save', 'Save') }}
                    </UButton>
                    </div>
                </div>
                </template>

                <UForm :state="basicSection.state" class="space-y-4" @submit.prevent>
                <div class="grid gap-4 md:grid-cols-2">
                    <UFormField :label="tt('ui.fields.name', 'Name')" required>
                    <UInput v-model="basicSection.state.name" required />
                    </UFormField>

                    <UFormField :label="tt('ui.fields.code', 'Code')">
                    <UInput v-model="basicSection.state.code" />
                    </UFormField>

                    <UFormField :label="tt('ui.fields.status', 'Status')">
                    <USelectMenu
                        v-model="basicSection.state.status"
                        :items="statusOptions"
                        option-attribute="label"
                        value-key="value"
                        class="w-full"
                    />
                    </UFormField>

                    <UFormField :label="tt('ui.fields.imageUrl', 'Image URL')">
                    <UInput v-model="basicSection.state.image" type="url" />
                    </UFormField>
                </div>

                <div class="space-y-4">
                    <UFormField :label="tt('ui.fields.shortText', 'Short text')">
                    <UTextarea v-model="basicSection.state.short_text" :rows="3" />
                    </UFormField>

                    <UFormField :label="tt('ui.fields.description', 'Description')">
                    <UTextarea v-model="basicSection.state.description" :rows="4" />
                    </UFormField>
                </div>

                <div class="flex items-center gap-2">
                    <USwitch v-model="basicSection.state.is_active" size="md" />
                    <span class="text-sm text-neutral-600 dark:text-neutral-300">
                    {{ tt('ui.fields.active', 'Active') }}
                    </span>
                </div>
                </UForm>
            </UCard>

            <UCard>
                <template #header>
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-100">
                    {{ tt('ui.sections.translations', 'Translations') }}
                    </h3>
                    <div class="flex items-center gap-2">
                    <USelectMenu
                        v-if="translationLocaleItems.length"
                        v-model="selectedTranslationLang"
                        :items="translationLocaleItems"
                        option-attribute="label"
                        value-key="value"
                        size="xs"
                        class="min-w-[8rem]"
                    />
                    <StatusBadge
                        v-if="currentTranslationMeta?.status"
                        type="translation"
                        :value="currentTranslationMeta.status"
                        size="xs"
                        class="min-w-[8rem]"
                    />
                    <UButton
                        variant="soft"
                        color="neutral"
                        size="xs"
                        icon="i-heroicons-arrow-path"
                        :disabled="!selectedTranslationLang"
                        :loading="translationLoading.value"
                        @click="reloadTranslation"
                    />
                    </div>
                </div>
                </template>

                <div v-if="translationLoading.value" class="space-y-3">
                <USkeleton class="h-4 w-24" />
                <USkeleton class="h-10 w-full" />
                <USkeleton class="h-24 w-full" />
                </div>
                <template v-else>
                <div v-if="!selectedTranslationLang" class="text-sm text-neutral-500 dark:text-neutral-400">
                    {{ tt('ui.notifications.noLanguages', 'No additional languages configured') }}
                </div>
                <div v-else class="space-y-4">
                    <div v-if="showEnglishReference" class="rounded border border-neutral-200 bg-neutral-50 p-3 text-xs dark:border-neutral-700 dark:bg-neutral-800">
                    <p class="font-medium text-neutral-600 dark:text-neutral-200 mb-1">
                        {{ tt('ui.fields.original', 'Original (EN)') }}
                    </p>
                    <p class="text-neutral-600 dark:text-neutral-300">
                        {{ englishTranslation?.name || '—' }}
                    </p>
                    <p class="mt-2 whitespace-pre-wrap text-neutral-500 dark:text-neutral-400">
                        {{ englishTranslation?.description || '—' }}
                    </p>
                    </div>

                    <UForm :state="translationSection.state" class="space-y-4" @submit.prevent>
                    <UFormField :label="tt('ui.fields.name', 'Name')" required>
                        <UInput v-model="translationSection.state.name" required />
                    </UFormField>

                    <UFormField :label="tt('ui.fields.shortText', 'Short text')">
                        <UTextarea v-model="translationSection.state.short_text" :rows="3" />
                    </UFormField>

                    <UFormField :label="tt('ui.fields.description', 'Description')">
                        <UTextarea v-model="translationSection.state.description" :rows="5" />
                    </UFormField>

                    <div class="flex justify-end gap-2">
                        <UButton
                        variant="soft"
                        color="neutral"
                        size="xs"
                        :disabled="!translationSection.dirty.value"
                        @click="translationSection.reset"
                        >
                        {{ tt('ui.actions.reset', 'Reset') }}
                        </UButton>
                        <UButton
                        color="primary"
                        size="xs"
                        :disabled="!translationSection.dirty.value"
                        :loading="translationSection.loading.value"
                        @click="saveTranslation"
                        >
                        {{ tt('ui.actions.save', 'Save') }}
                        </UButton>
                    </div>
                    </UForm>
                </div>
                </template>
            </UCard>

            <UCard>
                <template #header>
                <div class="flex items-center justify-between gap-2">
                    <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-100">
                    {{ tt('ui.fields.metadata', 'Metadata') }}
                    </h3>
                    <div class="flex items-center gap-2">
                    <UButton
                        size="xs"
                        variant="soft"
                        color="neutral"
                        icon="i-heroicons-code-bracket-square"
                        @click="metadataModalOpen = true"
                    >
                        {{ tt('ui.actions.editJson', 'Edit JSON') }}
                    </UButton>
                    <UButton
                        color="primary"
                        size="xs"
                        :disabled="!metadataSection.dirty.value"
                        :loading="metadataSection.loading.value"
                        @click="saveMetadata"
                    >
                        {{ tt('ui.actions.save', 'Save') }}
                    </UButton>
                    </div>
                </div>
                </template>

                <div class="space-y-4">
                <pre class="max-h-64 overflow-auto rounded border border-neutral-200 bg-neutral-50 p-4 text-xs font-mono leading-relaxed dark:border-neutral-700 dark:bg-neutral-900">
    {{ metadataPretty }}
                </pre>
                </div>
            </UCard>

            <UCard>
                <template #header>
                <div class="flex items-center justify-between gap-2">
                    <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-100">
                    {{ tt('domains.arcana.rules.tab', 'Rules') }}
                    </h3>
                </div>
                </template>
                <UAlert
                color="neutral"
                icon="i-heroicons-information-circle"
                :title="tt('domains.arcana.rules.placeholderTitle', 'No rules configured yet')"
                :description="tt('domains.arcana.rules.placeholderDescription', 'Rules management for this entity will be available soon.')"
                />
            </UCard>
            </template>
        </div>
        </div>
    </template>
  </USlideover>

  <JsonModal
    v-if="metadataModalOpen"
    v-model="metadataModalOpen"
    :value="metadataSection.state.metadata"
    :title="tt('ui.fields.metadata', 'Metadata')"
    :description="tt('ui.actions.editJson', 'Edit raw JSON metadata')"
    editable
    auto-edit
    @save="onMetadataEdited"
    @update:value="(value) => metadataSection.patch({ metadata: value })"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { useI18n, useToast, useRequestURL } from '#imports'
import EntitySummary from '~/components/common/EntitySummary.vue'
import StatusBadge from '~/components/common/StatusBadge.vue'
import JsonModal from '~/components/common/JsonModal.vue'
import { useFormSection } from '~/composables/common/useFormSection'
import { useEntityCapabilities } from '~/composables/common/useEntityCapabilities'
import { useApiFetch } from '~/utils/fetcher'
import { useCardStatus } from '~/utils/status'

interface BasicFormState {
  name: string
  code: string | null
  short_text: string | null
  description: string | null
  status: string | null
  is_active: boolean
  image: string | null
}

interface TranslationFormState {
  lang: string
  name: string
  short_text: string | null
  description: string | null
}

interface MetadataFormState {
  metadata: Record<string, any> | null
}

type TranslationStatusValue = 'complete' | 'partial' | 'missing'

interface TranslationMetaState {
  hasTranslation: boolean
  isFallback: boolean
  status: TranslationStatusValue
}

const DEFAULT_LANG = 'en'

const props = defineProps<{
  id: number | null
  kind: string
  neighbors?: {
    prev: number | null
    next: number | null
  } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
  (e: 'navigate', id: number): void
}>()

const open = defineModel<boolean>('open', { default: true })

const { t, te, locale, availableLocales } = useI18n()
const toast = useToast()
const apiFetch = useApiFetch
const capabilities = useEntityCapabilities(() => props.kind ?? null)
const statusUtil = useCardStatus()

const loading = ref(true)
const error = ref<any>(null)
const entity = ref<Record<string, any> | null>(null)

const translationLoading = ref(false)
const metadataModalOpen = ref(false)

const localeValue = computed(() => (typeof locale === 'string' ? locale : locale.value) || DEFAULT_LANG)
const availableLocaleList = computed(() => (availableLocales && availableLocales.length ? availableLocales : [DEFAULT_LANG]))

const translationLocales = computed(() => availableLocaleList.value.filter(code => code !== DEFAULT_LANG))
const translationLocaleItems = computed(() => translationLocales.value.map(code => ({ value: code, label: code.toUpperCase() })))
const selectedTranslationLang = ref<string | null>(null)

const basicBaseline = ref<BasicFormState>(createEmptyBasicState())
const translationBaseline = ref<TranslationFormState>(createEmptyTranslationState(localeValue.value))
const metadataBaseline = ref<MetadataFormState>({ metadata: null })

const translationCache = reactive<Record<string, TranslationFormState>>({})
const translationMeta = reactive<Record<string, TranslationMetaState>>({})

function buildTranslationMeta(hasTranslation: boolean, isFallback: boolean): TranslationMetaState {
  let status: TranslationStatusValue
  if (!hasTranslation) status = 'missing'
  else if (isFallback) status = 'partial'
  else status = 'complete'
  return { hasTranslation, isFallback, status }
}

const basicSection = useFormSection<BasicFormState>(
  computed(() => basicBaseline.value),
  {
    onSave: async (state) => {
      const diff = diffState(state, basicBaseline.value)
      if (!Object.keys(diff).length) return { success: true }
      try {
        await apiFetch(`${props.kind}/${props.id}`, {
          method: 'PATCH',
          body: {
            ...diff,
            lang: DEFAULT_LANG,
          },
          ...apiBaseOptions(),
        })
        basicBaseline.value = clone({ ...basicBaseline.value, ...diff })
        toast.add({ title: tt('ui.notifications.saved', 'Changes saved'), color: 'success' })
        emit('saved')
        await refreshEntity()
        return { success: true }
      } catch (err: any) {
        const message = resolveErrorMessage(err)
        toast.add({ title: tt('ui.notifications.error', 'Error'), description: message, color: 'error' })
        return { success: false, message }
      }
    },
  },
)

const translationSection = useFormSection<TranslationFormState>(
  computed(() => translationBaseline.value),
  {
    onSave: async (state) => {
      const diff = diffState(state, translationBaseline.value, ['lang'])
      if (!Object.keys(diff).length) return { success: true }
      try {
        await apiFetch(`${props.kind}/${props.id}`, {
          method: 'PATCH',
          body: {
            ...diff,
            lang: state.lang,
          },
          ...apiBaseOptions(),
        })
        translationCache[state.lang] = clone({ ...translationBaseline.value, ...diff })
        translationBaseline.value = clone({ ...translationBaseline.value, ...diff })
        translationMeta[state.lang] = buildTranslationMeta(
          Boolean((translationCache[state.lang]?.name ?? '').trim()),
          false,
        )
        toast.add({ title: tt('ui.notifications.saved', 'Changes saved'), color: 'success' })
        emit('saved')
        await refreshEntity()
        return { success: true }
      } catch (err: any) {
        const message = resolveErrorMessage(err)
        toast.add({ title: tt('ui.notifications.error', 'Error'), description: message, color: 'error' })
        return { success: false, message }
      }
    },
  },
)

const metadataSection = useFormSection<MetadataFormState>(
  computed(() => metadataBaseline.value),
  {
    onSave: async (state) => {
      const diff = diffState(state, metadataBaseline.value)
      if (!Object.keys(diff).length) return { success: true }
      try {
        await apiFetch(`${props.kind}/${props.id}`, {
          method: 'PATCH',
          body: {
            metadata: state.metadata ?? {},
          },
          ...apiBaseOptions(),
        })
        metadataBaseline.value = { metadata: clone(state.metadata ?? {}) }
        toast.add({ title: tt('ui.notifications.saved', 'Changes saved'), color: 'success' })
        emit('saved')
        await refreshEntity()
        return { success: true }
      } catch (err: any) {
        const message = resolveErrorMessage(err)
        toast.add({ title: tt('ui.notifications.error', 'Error'), description: message, color: 'error' })
        return { success: false, message }
      }
    },
  },
)

const statusOptions = computed(() => statusUtil.options().map(option => ({ value: option.value, label: t(option.labelKey) as string })))

const currentTranslationMeta = computed(() => {
  const lang = selectedTranslationLang.value || DEFAULT_LANG
  return translationMeta[lang] ?? null
})

const summaryTranslationStatus = computed(() => {
  if (!entity.value) return null
  const hasTranslation = Boolean(entity.value.language_code_resolved ?? entity.value.language_code)
  const isFallback = Boolean(entity.value.language_is_fallback)
  return buildTranslationMeta(hasTranslation, isFallback)
})

const showEnglishReference = computed(() => {
  const lang = selectedTranslationLang.value
  return Boolean(lang && lang !== DEFAULT_LANG && englishTranslation?.value)
})

const englishTranslation = computed(() => translationCache[DEFAULT_LANG] ?? null)

const metadataPretty = computed(() => {
  try {
    return JSON.stringify(metadataSection.state.metadata ?? {}, null, 2)
  } catch {
    return String(metadataSection.state.metadata ?? '')
  }
})

const summaryMetadata = computed(() => {
  if (!entity.value) return []
  const items: Array<{ label: string; value: string }> = []
  if (entity.value.created_at) {
    items.push({ label: tt('ui.fields.createdAt', 'Created'), value: new Date(entity.value.created_at).toLocaleString() })
  }
  if (entity.value.modified_at) {
    items.push({ label: tt('ui.fields.modifiedAt', 'Updated'), value: new Date(entity.value.modified_at).toLocaleString() })
  }
  return items
})

const headerTitle = computed(() => entity.value?.name || entity.value?.code || `#${props.id}`)
const kindLabel = computed(() => tt(`entities.${props.kind}`, props.kind))
const errorMessage = computed(() => error.value ? resolveErrorMessage(error.value) : null)
function normalizeNeighbor(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

const prevId = computed(() => normalizeNeighbor(props.neighbors?.prev ?? null))
const nextId = computed(() => normalizeNeighbor(props.neighbors?.next ?? null))
const canGoPrev = computed(() => prevId.value !== null)
const canGoNext = computed(() => nextId.value !== null)

watch(
  () => props.id,
  async (id) => {
    if (!id) return
    await loadEntity()
  },
  { immediate: true },
)

watch(translationLocales, (locales) => {
  if (!locales.length) {
    selectedTranslationLang.value = null
    return
  }
  if (!selectedTranslationLang.value || !locales.includes(selectedTranslationLang.value)) {
    const preferred = locales.includes(localeValue.value) ? localeValue.value : locales[0]
    selectedTranslationLang.value = preferred ?? null
  }
}, { immediate: true })

watch(
  () => selectedTranslationLang.value,
  async (lang) => {
    if (!lang || lang === DEFAULT_LANG) return
    await ensureTranslation(lang)
  },
  { immediate: true },
)

watchEffect(() => {
  if (!entity.value) return
  const basic = buildBasicState(entity.value)
  basicBaseline.value = clone(basic)
  if (!basicSection.dirty.value) basicSection.patch(basic)

  const metadataValue = entity.value.metadata ?? {}
  metadataBaseline.value = { metadata: clone(metadataValue) }
  if (!metadataSection.dirty.value) metadataSection.patch({ metadata: clone(metadataValue) })

  const defaultTranslation = buildTranslationState(entity.value, DEFAULT_LANG)
  translationCache[DEFAULT_LANG] = clone(defaultTranslation)
  translationMeta[DEFAULT_LANG] = buildTranslationMeta(
    Boolean(defaultTranslation.name?.trim()),
    Boolean(entity.value.language_is_fallback),
  )
  translationBaseline.value = clone(defaultTranslation)
  if (!translationSection.dirty.value) translationSection.patch(defaultTranslation)
})

async function loadEntity() {
  if (!props.id) return
  loading.value = true
  error.value = null
  try {
    const response = await apiFetch(`${props.kind}/${props.id}`, {
      method: 'GET',
      params: { lang: localeValue.value },
      ...apiBaseOptions(),
    })
    const data = response?.data ?? response ?? null
    entity.value = data
  } catch (err: any) {
    error.value = err
  } finally {
    loading.value = false
  }
}

async function refreshEntity() {
  await loadEntity()
}

async function ensureTranslation(lang: string) {
  if (translationCache[lang]) {
    translationBaseline.value = clone(translationCache[lang])
    if (!translationSection.dirty.value) translationSection.patch(translationCache[lang])
    return
  }

  translationLoading.value = true
  try {
    const response = await apiFetch(`${props.kind}/${props.id}`, {
      method: 'GET',
      params: { lang },
      ...apiBaseOptions(),
    })
    const data = response?.data ?? {}
    const state = buildTranslationState(data, lang)
    translationCache[lang] = clone(state)
    translationMeta[lang] = buildTranslationMeta(
      Boolean(state.name?.trim()),
      Boolean((data as any)?.language_is_fallback),
    )
    translationBaseline.value = clone(state)
  } catch (err: any) {
    const notFound = isNotFoundError(err)
    if (!notFound) {
      const message = resolveErrorMessage(err)
      toast.add({ title: tt('ui.notifications.error', 'Error'), description: message, color: 'error' })
    }
    const emptyState = createEmptyTranslationState(lang)
    translationCache[lang] = emptyState
    translationMeta[lang] = buildTranslationMeta(false, false)
    translationBaseline.value = clone(emptyState)
  } finally {
    translationLoading.value = false
  }
}

function saveBasic() {
  return basicSection.save()
}

function saveTranslation() {
  return translationSection.save()
}

function saveMetadata() {
  return metadataSection.save()
}

async function reloadTranslation() {
  const lang = selectedTranslationLang.value
  if (!lang) return
  delete translationCache[lang]
  translationSection.reset()
  await ensureTranslation(lang)
}

function onMetadataEdited(value: any) {
  metadataSection.patch({ metadata: value })
}

function handleClose() {
  open.value = false
  emit('close')
}

function goPrev() {
  const target = prevId.value
  if (!canGoPrev.value || target === null) return
  emit('navigate', target)
}

function goNext() {
  const target = nextId.value
  if (!canGoNext.value || target === null) return
  emit('navigate', target)
}

function tt(key: string, fallback: string): string {
  const translated = te(key) ? (t(key) as string) : key
  return translated === key ? fallback : translated
}

function resolveApiBase(): string | undefined {
  if (!import.meta.server) return undefined
  const url = useRequestURL()
  return `${url.origin}/api`
}

function apiBaseOptions(): { baseURL?: string } {
  const base = resolveApiBase()
  return base ? { baseURL: base } : {}
}

function createEmptyBasicState(): BasicFormState {
  return {
    name: '',
    code: '',
    short_text: null,
    description: null,
    status: 'draft',
    is_active: true,
    image: null,
  }
}

function buildBasicState(raw: Record<string, any>): BasicFormState {
  return {
    name: raw.name ?? '',
    code: raw.code ?? '',
    short_text: raw.short_text ?? null,
    description: raw.description ?? null,
    status: raw.status ?? 'draft',
    is_active: Boolean(raw.is_active ?? true),
    image: raw.image ?? null,
  }
}

function createEmptyTranslationState(lang: string): TranslationFormState {
  return {
    lang,
    name: '',
    short_text: null,
    description: null,
  }
}

function buildTranslationState(raw: Record<string, any>, lang: string): TranslationFormState {
  return {
    lang,
    name: raw.name ?? '',
    short_text: raw.short_text ?? null,
    description: raw.description ?? null,
  }
}

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {
      /* noop */
    }
  }
  return JSON.parse(JSON.stringify(value)) as T
}

function diffState<T extends Record<string, any>>(current: T, baseline: T, exclude: string[] = []): Partial<T> {
  const result: Partial<T> = {}
  for (const key of Object.keys(current)) {
    if (exclude.includes(key)) continue
    if (!deepEqual(current[key], baseline[key])) {
      result[key] = clone(current[key])
    }
  }
  return result
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => deepEqual(item, b[index]))
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false
    for (const key of aKeys) {
      if (!deepEqual(a[key], b[key])) return false
    }
    return true
  }
  return false
}

function resolveErrorMessage(err: any): string {
  return err?.data?.message || err?.message || tt('ui.notifications.errorGeneric', 'Unexpected error')
}
</script>
