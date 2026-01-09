<!-- app/pages/manage/arcana/[id].vue -->
<template>
  <div class="space-y-4 px-4 pb-8">
    <div v-if="pending" class="space-y-4">
      <USkeleton class="h-24 w-full" />
      <USkeleton class="h-96 w-full" />
    </div>

    <template v-else>
      <UAlert
        v-if="error"
        color="error"
        :title="tt('ui.notifications.error', 'Error loading arcana')"
        :description="String(error)"
      />

      <UAlert
        v-else-if="!entity"
        color="warning"
        :title="tt('ui.notifications.notFound', 'Arcana not found')"
        :description="tt('ui.notifications.tryAgain', 'Verify the identifier and try again.')"
      />

      <template v-else>
        <EntitySummary
          :title="entity.name || entity.code || `#${entity.id}`"
          :subtitle="entity.code ? `#${entity.code}` : null"
          :description="entity.short_text"
          :status="entity.status"
          :release-stage="entity.release_stage ?? null"
          :translation-status="summaryTranslationStatus"
          :resolved-lang="entity.language_code_resolved ?? null"
          :fallback-lang="detailLang"
          :tags="entity.tags ?? []"
          :metadata="summaryMetadata"
          entity-kind="arcana"
          :capabilities="entityCapabilities"
        />

        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {{ tt('domains.arcana.manage.title', 'Edit arcana') }}
                </h2>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  {{ tt('domains.arcana.manage.description', 'Update base details, translations and metadata in one place.') }}
                </p>
              </div>
            </div>
          </template>

          <UTabs v-model="activeTab" :items="tabItems" :unmount-on-hide="false">
            <template #content="{ item }">
              <div v-if="item.value === 'basic'" class="space-y-6">
                <UForm :state="basicSection.state" class="space-y-4" @submit.prevent="saveBasic">
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
                        value-key="value"
                        option-attribute="label"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField :label="tt('ui.fields.imageUrl', 'Image URL')">
                      <UInput v-model="basicSection.state.image" type="url" />
                    </UFormField>
                  </div>

                  <div class="grid gap-4 md:grid-cols-2">
                    <UFormField :label="tt('ui.fields.shortText', 'Short text')">
                      <UTextarea v-model="basicSection.state.short_text" :rows="3" />
                    </UFormField>

                    <UFormField :label="tt('ui.fields.description', 'Description')">
                      <UTextarea v-model="basicSection.state.description" :rows="3" />
                    </UFormField>
                  </div>

                  <div class="flex items-center gap-2">
                    <USwitch v-model="basicSection.state.is_active" size="md" />
                    <span class="text-sm text-neutral-600 dark:text-neutral-300">
                      {{ tt('ui.fields.active', 'Active') }}
                    </span>
                  </div>

                  <div v-if="basicSection.error" class="text-sm text-error-500">
                    {{ basicSection.error }}
                  </div>

                  <div class="flex justify-end gap-2">
                    <UButton
                      color="neutral"
                      variant="soft"
                      :label="tt('ui.actions.reset', 'Reset')"
                      :disabled="!basicSection.dirty.value"
                      @click="basicSection.reset"
                    />
                    <UButton
                      type="submit"
                      color="primary"
                      :label="tt('ui.actions.save', 'Save')"
                      :loading="basicSection.loading.value"
                      :disabled="!basicSection.dirty.value"
                    />
                  </div>
                </UForm>
              </div>

              <div v-else-if="item.value === 'translations'" class="space-y-6">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <UFormField :label="tt('ui.fields.language', 'Language')" class="min-w-[12rem]">
                      <USelectMenu
                        v-model="selectedTranslationLang"
                        :items="translationLocaleItems"
                        value-key="value"
                        option-attribute="label"
                        class="w-full"
                      />
                    </UFormField>

                    <StatusBadge
                      v-if="currentTranslationMeta?.status"
                      type="translation"
                      :value="currentTranslationMeta.status"
                      size="xs"
                    />
                  </div>

                  <UButton
                    v-if="selectedTranslationLang"
                    size="xs"
                    variant="soft"
                    color="neutral"
                    icon="i-heroicons-arrow-path"
                    :label="tt('ui.actions.reload', 'Reload')"
                    :loading="translationLoading"
                    @click="reloadTranslation"
                  />
                </div>

                <UAlert
                  v-if="!selectedTranslationLang"
                  color="neutral"
                  :title="tt('ui.notifications.noLanguages', 'No additional languages configured')"
                  :description="tt('ui.notifications.noLanguagesDescription', 'Add more locales in i18n config to enable translations.')"
                />

                <div v-else>
                  <USkeleton v-if="translationLoading" class="h-48 w-full" />

                  <UForm
                    v-else
                    :state="translationSection.state"
                    class="space-y-4"
                    @submit.prevent="saveTranslation"
                  >
                    <UFormField :label="tt('ui.fields.name', 'Name')" required>
                      <UInput v-model="translationSection.state.name" required />
                    </UFormField>

                    <UFormField :label="tt('ui.fields.shortText', 'Short text')">
                      <UTextarea v-model="translationSection.state.short_text" :rows="3" />
                    </UFormField>

                    <UFormField :label="tt('ui.fields.description', 'Description')">
                      <UTextarea v-model="translationSection.state.description" :rows="6" />
                    </UFormField>

                    <div v-if="translationSection.error" class="text-sm text-error-500">
                      {{ translationSection.error }}
                    </div>

                    <div class="flex justify-end gap-2">
                      <UButton
                        color="neutral"
                        variant="soft"
                        :label="tt('ui.actions.reset', 'Reset')"
                        :disabled="!translationSection.dirty.value"
                        @click="translationSection.reset"
                      />
                      <UButton
                        type="submit"
                        color="primary"
                        :label="tt('ui.actions.save', 'Save')"
                        :loading="translationSection.loading.value"
                        :disabled="!translationSection.dirty.value"
                      />
                    </div>
                  </UForm>
                </div>
              </div>

              <div v-else-if="item.value === 'metadata'" class="space-y-4">
                <div class="flex items-center justify-between gap-3">
                  <h3 class="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    {{ tt('ui.fields.metadata', 'Metadata') }}
                  </h3>
                  <div class="flex gap-2">
                    <UButton
                      variant="soft"
                      color="neutral"
                      size="xs"
                      icon="i-heroicons-code-bracket-square"
                      :label="tt('ui.actions.editJson', 'Edit JSON')"
                      @click="metadataModalOpen = true"
                    />
                  </div>
                </div>

                <pre class="max-h-64 overflow-auto rounded border border-neutral-200 bg-neutral-50 p-4 text-xs font-mono leading-relaxed dark:border-neutral-700 dark:bg-neutral-900"><code>{{ metadataPretty }}</code></pre>

                <div v-if="metadataSection.error" class="text-sm text-error-500">
                  {{ metadataSection.error }}
                </div>

                <div class="flex justify-end gap-2">
                  <UButton
                    color="neutral"
                    variant="soft"
                    :label="tt('ui.actions.reset', 'Reset')"
                    :disabled="!metadataSection.dirty.value"
                    @click="metadataSection.reset"
                  />
                  <UButton
                    color="primary"
                    :label="tt('ui.actions.save', 'Save')"
                    :loading="metadataSection.loading.value"
                    :disabled="!metadataSection.dirty.value"
                    @click="saveMetadata"
                  />
                </div>
              </div>

              <div v-else-if="item.value === 'rules'" class="space-y-3">
                <UAlert
                  color="neutral"
                  icon="i-heroicons-information-circle"
                  :title="tt('domains.arcana.rules.placeholderTitle', 'No rules configured yet')"
                  :description="tt('domains.arcana.rules.placeholderDescription', 'Rules management for Arcana will be available soon.')"
                />
              </div>
            </template>
          </UTabs>
        </UCard>

        <JsonModal
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { useI18n, useRoute, useAsyncData, useToast, useRequestURL } from '#imports'
import EntitySummary from '~/components/common/EntitySummary.vue'
import JsonModal from '~/components/common/JsonModal.vue'
import StatusBadge from '~/components/common/StatusBadge.vue'
import { useQuerySync } from '~/composables/common/useQuerySync'
import { useFormSection } from '~/composables/common/useFormSection'
import { useEntityCapabilities } from '~/composables/common/useEntityCapabilities'
import { useCardStatus } from '~/utils/status'
import { arcanaUpdateSchema } from '@shared/schemas/entities/arcana'
import { useApiFetch } from '~/utils/fetcher'
import type { EntityMetadataItem } from '~/components/common/entityDisplay'

interface BasicFormState {
  name: string
  code: string
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

type TabKey = 'basic' | 'translations' | 'metadata' | 'rules'

const TAB_VALUES: TabKey[] = ['basic', 'translations', 'metadata', 'rules']
const DEFAULT_LANG = 'en'

definePageMeta({ layout: 'default' })

const { t, te, locale, availableLocales } = useI18n()
const toast = useToast()
const route = useRoute()
const apiFetch = useApiFetch

function tt(key: string, fallback: string) {
  return te(key) ? (t(key) as string) : fallback
}

const localeValue = computed(() => (typeof locale === 'string' ? locale : locale.value) || DEFAULT_LANG)
const availableLocaleList = computed(() => availableLocales && availableLocales.length ? availableLocales : [DEFAULT_LANG])

const arcanaId = computed(() => {
  const raw = route.params.id
  const parsed = typeof raw === 'string' ? Number(raw) : Number(raw ?? NaN)
  return Number.isFinite(parsed) ? parsed : null
})
const detailLang = computed(() => {
  const raw = route.query.lang
  if (typeof raw === 'string' && raw.length) return raw
  return localeValue.value || DEFAULT_LANG
})

const asyncKey = computed(() => `manage-arcana:${arcanaId.value}:${detailLang.value}`)

function resolveApiBase(): string | undefined {
  if (!process.server) return undefined
  const url = useRequestURL()
  return `${url.origin}/api`
}

const { data: entityData, pending, error, refresh } = await useAsyncData(
  asyncKey.value,
  async () => {
    if (arcanaId.value === null) return null
    const params = detailLang.value ? { lang: detailLang.value } : undefined
    const baseURL = resolveApiBase()
    const response = await apiFetch(`/arcana/${arcanaId.value}`, {
      method: 'GET',
      params,
      baseURL,
    })
    return response?.data ?? response ?? null
  },
  {
    server: true,
    immediate: true,
    watch: [arcanaId, detailLang],
  },
)

const entity = computed(() => entityData.value as Record<string, any> | null)

const entityCapabilities = useEntityCapabilities('arcana')
const statusUtil = useCardStatus()
const statusOptions = computed(() => statusUtil.options().map(option => ({ value: option.value, label: t(option.labelKey) as string })))

const tabSync = useQuerySync({
  defaults: { tab: 'basic' as TabKey },
  parse: {
    tab: (value) => {
      const raw = Array.isArray(value) ? value[0] : value
      return TAB_VALUES.includes(raw as TabKey) ? (raw as TabKey) : 'basic'
    },
  },
  serialize: {
    tab: (value: TabKey) => (value === 'basic' ? undefined : value),
  },
  queryKeyMap: { tab: 'tab' },
})

const activeTab = computed<TabKey>({
  get: () => tabSync.state.tab,
  set: (value) => {
    tabSync.update({ tab: value })
  },
})

const tabItems = computed(() => [
  { label: tt('ui.sections.basic', 'Basic'), value: 'basic', icon: 'i-heroicons-document-text' },
  { label: tt('ui.sections.translations', 'Translations'), value: 'translations', icon: 'i-heroicons-language' },
  { label: tt('ui.fields.metadata', 'Metadata'), value: 'metadata', icon: 'i-heroicons-code-bracket-square' },
  { label: tt('domains.arcana.rules.tab', 'Rules'), value: 'rules', icon: 'i-heroicons-scale' },
])

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

function buildBasicState(raw: Record<string, any>, translationOverride?: TranslationFormState | null): BasicFormState {
  const translation = translationOverride ?? null
  return {
    name: translation?.name ?? raw.name ?? '',
    code: raw.code ?? '',
    short_text: translation?.short_text ?? raw.short_text ?? null,
    description: translation?.description ?? raw.description ?? null,
    status: raw.status ?? 'draft',
    is_active: Boolean(raw.is_active ?? true),
    image: raw.image ?? null,
  }
}

function createEmptyTranslationState(): TranslationFormState {
  return {
    lang: DEFAULT_LANG,
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
      // ignore fallthrough
    }
  }
  return JSON.parse(JSON.stringify(value)) as T
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

function diffState<T extends Record<string, any>>(current: T, baseline: T, exclude: string[] = []): Partial<T> {
  const result: Partial<T> = {}
  for (const key of Object.keys(current)) {
    if (exclude.includes(key)) continue
    if (!deepEqual(current[key], baseline[key])) {
      result[key] = current[key]
    }
  }
  return result
}

function resolveErrorMessage(err: any): string {
  return err?.data?.message || err?.message || tt('ui.notifications.errorGeneric', 'Unexpected error')
}

function isNotFoundError(err: any): boolean {
  const status = err?.status ?? err?.response?.status
  const statusCode = err?.data?.statusCode ?? err?.statusCode
  return status === 404 || statusCode === 404
}

const basicBaseline = ref<BasicFormState>(createEmptyBasicState())
const basicSection = useFormSection<BasicFormState>(
  computed(() => basicBaseline.value),
  {
    validator: (state) => {
      arcanaUpdateSchema.parse({
        ...state,
        status: state.status ?? undefined,
      })
    },
    onSave: async (state) => {
      const baseline = basicBaseline.value
      const diff = diffState(state, baseline)
      if (!Object.keys(diff).length) {
        return { success: true }
      }

      try {
        await apiFetch(`/arcana/${arcanaId.value}`, {
          method: 'PATCH',
          body: {
            ...diff,
            lang: DEFAULT_LANG,
          },
        })
        basicBaseline.value = { ...baseline, ...diff }
        toast.add({ title: tt('ui.notifications.saved', 'Changes saved'), color: 'success' })
        await refresh()
        return { success: true }
      } catch (err: any) {
        const message = resolveErrorMessage(err)
        toast.add({ title: tt('ui.notifications.error', 'Error'), description: message, color: 'error' })
        return { success: false, message }
      }
    },
  },
)

const translationBaseline = ref<TranslationFormState>(createEmptyTranslationState())
const translationCache = reactive<Record<string, TranslationFormState>>({})
const translationMeta = reactive<Record<string, TranslationMetaState>>({})
const translationLoading = ref(false)
const defaultTranslationLoading = ref(false)

const translationSchema = arcanaUpdateSchema.pick({ name: true, short_text: true, description: true })

function buildTranslationMeta(hasTranslation: boolean, isFallback: boolean): TranslationMetaState {
  let status: TranslationStatusValue
  if (!hasTranslation) status = 'missing'
  else if (isFallback) status = 'partial'
  else status = 'complete'
  return { hasTranslation, isFallback, status }
}
const translationSection = useFormSection<TranslationFormState>(
  computed(() => translationBaseline.value),
  {
    validator: (state) => {
      translationSchema.parse({
        name: state.name,
        short_text: state.short_text ?? undefined,
        description: state.description ?? undefined,
      })
    },
    onSave: async (state) => {
      const baseline = translationBaseline.value
      const diff = diffState(state, baseline, ['lang'])
      if (!Object.keys(diff).length) {
        return { success: true }
      }

      try {
        await apiFetch(`/arcana/${arcanaId.value}`, {
          method: 'PATCH',
          body: {
            ...diff,
            lang: state.lang,
          },
        })
        translationCache[state.lang] = {
          ...translationCache[state.lang],
          lang: state.lang,
          ...diff,
        }
        translationBaseline.value = { ...baseline, ...diff }
        translationMeta[state.lang] = buildTranslationMeta(Boolean(state.name?.trim()), false)
        toast.add({ title: tt('ui.notifications.saved', 'Changes saved'), color: 'success' })
        await refresh()
        return { success: true }
      } catch (err: any) {
        const message = resolveErrorMessage(err)
        toast.add({ title: tt('ui.notifications.error', 'Error'), description: message, color: 'error' })
        return { success: false, message }
      }
    },
  },
)

const metadataBaseline = ref<MetadataFormState>({ metadata: null })
const metadataSection = useFormSection<MetadataFormState>(
  computed(() => metadataBaseline.value),
  {
    onSave: async (state) => {
      const baseline = metadataBaseline.value
      const diff = diffState(state, baseline)
      if (!Object.keys(diff).length) {
        return { success: true }
      }

      try {
        await apiFetch(`/arcana/${arcanaId.value}`, {
          method: 'PATCH',
          body: {
            metadata: state.metadata ?? {},
          },
        })
        metadataBaseline.value = {
          metadata: clone(state.metadata ?? {}),
        }
        toast.add({ title: tt('ui.notifications.saved', 'Changes saved'), color: 'success' })
        await refresh()
        return { success: true }
      } catch (err: any) {
        const message = resolveErrorMessage(err)
        toast.add({ title: tt('ui.notifications.error', 'Error'), description: message, color: 'error' })
        return { success: false, message }
      }
    },
  },
)

const metadataModalOpen = ref(false)
const metadataPretty = computed(() => {
  try {
    return JSON.stringify(metadataSection.state.metadata ?? {}, null, 2)
  } catch {
    return String(metadataSection.state.metadata ?? '')
  }
})

const translationLocales = computed(() => availableLocaleList.value.filter((code) => code !== DEFAULT_LANG))
const translationLocaleItems = computed(() => translationLocales.value.map((code) => ({ value: code, label: code.toUpperCase() })))

const selectedTranslationLang = ref<string | null>(null)

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

watchEffect(() => {
  if (!entity.value) return
  const resolvedLang = normalizeLang(entity.value.language_code_resolved ?? entity.value.language_code ?? DEFAULT_LANG)
  const isFallback = Boolean(entity.value.language_is_fallback)

  if (resolvedLang === DEFAULT_LANG || isFallback) {
    const nextBasic = buildBasicState(entity.value)
    if (!basicSection.dirty.value) {
      basicSection.patch(nextBasic)
      basicBaseline.value = clone(nextBasic)
    }

    const defaultTranslation = buildTranslationState(entity.value, DEFAULT_LANG)
    translationCache[DEFAULT_LANG] = clone(defaultTranslation)
    translationMeta[DEFAULT_LANG] = buildTranslationMeta(Boolean(defaultTranslation.name?.trim()), isFallback)

    if (!translationSection.dirty.value && translationBaseline.value.lang === DEFAULT_LANG) {
      translationBaseline.value = clone(defaultTranslation)
    }
  } else {
    if (!translationCache[DEFAULT_LANG] && !defaultTranslationLoading.value) {
      void ensureDefaultTranslation()
    }

    if (!basicSection.dirty.value && translationCache[DEFAULT_LANG]) {
      const nextBasic = buildBasicState(entity.value, translationCache[DEFAULT_LANG])
      basicSection.patch(nextBasic)
      basicBaseline.value = clone(nextBasic)
    }

    const currentTranslation = buildTranslationState(entity.value, resolvedLang)
    translationCache[resolvedLang] = clone(currentTranslation)
    translationMeta[resolvedLang] = buildTranslationMeta(Boolean(currentTranslation.name?.trim()), isFallback)

    if (!translationSection.dirty.value && translationBaseline.value.lang === resolvedLang) {
      translationBaseline.value = clone(currentTranslation)
    }
  }

  const metadataValue = entity.value.metadata ?? {}
  if (!metadataSection.dirty.value) {
    metadataSection.patch({ metadata: clone(metadataValue) })
    metadataBaseline.value = { metadata: clone(metadataValue) }
  }

  if (!selectedTranslationLang.value && translationLocales.value.length) {
    selectedTranslationLang.value = translationLocales.value.includes(localeValue.value) ? localeValue.value : translationLocales.value[0]
  }
})

watch(
  () => selectedTranslationLang.value,
  async (lang) => {
    if (!lang) return

    const cached = translationCache[lang]
    if (cached) {
      if (!translationSection.dirty.value) {
        translationBaseline.value = clone(cached)
      }
      return
    }

    translationLoading.value = true
    try {
      const response = await apiFetch(`/arcana/${arcanaId.value}`, {
        method: 'GET',
        params: { lang },
        baseURL: resolveApiBase(),
      })
      const data = response?.data ?? response ?? {}
      const state = buildTranslationState(data, lang)
      translationCache[lang] = clone(state)
      translationMeta[lang] = buildTranslationMeta(Boolean(state.name?.trim()), Boolean(data?.language_is_fallback))
      if (!translationSection.dirty.value || translationBaseline.value.lang !== lang) {
        translationBaseline.value = clone(state)
      }
    } catch (err: any) {
      const notFound = isNotFoundError(err)
      if (!notFound) {
        const message = resolveErrorMessage(err)
        toast.add({ title: tt('ui.notifications.error', 'Error'), description: message, color: 'error' })
      }
      const emptyState = { ...createEmptyTranslationState(), lang }
      translationCache[lang] = emptyState
      translationMeta[lang] = buildTranslationMeta(false, false)
      if (!translationSection.dirty.value || translationBaseline.value.lang !== lang) {
        translationBaseline.value = clone(emptyState)
      }
    } finally {
      translationLoading.value = false
    }
  },
  { immediate: true },
)

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
  translationBaseline.value = { ...createEmptyTranslationState(), lang }
  await fetchTranslationForLang(lang)
}

async function fetchTranslationForLang(lang: string) {
  translationLoading.value = true
  try {
    const response = await apiFetch(`/arcana/${arcanaId.value}`, {
      method: 'GET',
      params: { lang },
      baseURL: resolveApiBase(),
    })
    const data = response?.data ?? {}
    const state = buildTranslationState(data, lang)
    translationCache[lang] = clone(state)
    translationMeta[lang] = buildTranslationMeta(Boolean(state.name?.trim()), Boolean(data?.language_is_fallback))
    translationBaseline.value = clone(state)
  } catch (err: any) {
    const notFound = isNotFoundError(err)
    if (!notFound) {
      const message = resolveErrorMessage(err)
      toast.add({ title: tt('ui.notifications.error', 'Error'), description: message, color: 'error' })
    }
    const emptyState = { ...createEmptyTranslationState(), lang }
    translationCache[lang] = emptyState
    translationMeta[lang] = buildTranslationMeta(false, false)
    translationBaseline.value = clone(emptyState)
  } finally {
    translationLoading.value = false
  }
}

function onMetadataEdited(value: any) {
  metadataSection.patch({ metadata: value })
}

function normalizeLang(value?: string | null): string {
  return (value ?? '').toString().trim().toLowerCase()
}

async function ensureDefaultTranslation() {
  if (translationCache[DEFAULT_LANG] || defaultTranslationLoading.value || !arcanaId.value) {
    return
  }

  defaultTranslationLoading.value = true
  try {
    const response = await apiFetch(`/arcana/${arcanaId.value}`, {
      method: 'GET',
      params: { lang: DEFAULT_LANG },
      baseURL: resolveApiBase(),
    })
    const data = response?.data ?? response ?? {}
    const state = buildTranslationState(data, DEFAULT_LANG)
    translationCache[DEFAULT_LANG] = clone(state)
    translationMeta[DEFAULT_LANG] = buildTranslationMeta(Boolean(state.name?.trim()), Boolean(data?.language_is_fallback))
    if (!basicSection.dirty.value) {
      const nextBasic = buildBasicState(entity.value ?? data, state)
      basicSection.patch(nextBasic)
      basicBaseline.value = clone(nextBasic)
    }
    if (!translationSection.dirty.value && translationBaseline.value.lang === DEFAULT_LANG) {
      translationBaseline.value = clone(state)
    }
  } catch {
    translationCache[DEFAULT_LANG] = createEmptyTranslationState()
    translationMeta[DEFAULT_LANG] = buildTranslationMeta(false, false)
  } finally {
    defaultTranslationLoading.value = false
  }
}

const currentTranslationMeta = computed(() => {
  const lang = selectedTranslationLang.value
  if (!lang) return null
  return translationMeta[lang] ?? null
})

const summaryTranslationStatus = computed(() => {
  if (!entity.value) return null
  const hasTranslation = Boolean(entity.value.language_code_resolved ?? entity.value.language_code)
  const isFallback = Boolean(entity.value.language_is_fallback)
  return buildTranslationMeta(hasTranslation, isFallback)
})

const summaryMetadata = computed<EntityMetadataItem[]>(() => {
  if (!entity.value) return []
  const items: (EntityMetadataItem | null)[] = [
    entity.value.code
      ? { label: tt('ui.fields.code', 'Code'), value: entity.value.code, icon: 'i-heroicons-hashtag' }
      : null,
    entity.value.create_user || entity.value.created_by
      ? {
          label: tt('ui.fields.createdBy', 'Created by'),
          value: entity.value.create_user ?? entity.value.created_by,
          icon: 'i-heroicons-user-circle',
        }
      : null,
  ]
  return items.filter(Boolean) as EntityMetadataItem[]
})
</script>
