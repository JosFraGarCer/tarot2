<!-- app/pages/manage/[entity]/[id]/studio.vue -->
<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950">
    <!-- Top status bar -->
    <header class="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
      <div class="mx-auto flex items-center justify-between gap-3 px-4 py-2 max-w-screen-2xl">
        <div class="flex items-center gap-2 min-w-0">
          <UButton
            variant="ghost"
            color="neutral"
            size="xs"
            icon="i-heroicons-arrow-left"
            :aria-label="tt('ui.actions.back', 'Back to list')"
            @click="navigateBack"
          />
          <USeparator direction="vertical" class="h-5 mx-1" />
          <UButton
            variant="soft"
            color="neutral"
            size="xs"
            icon="i-heroicons-chevron-left"
            :disabled="!hasPrev"
            :aria-label="tt('ui.actions.previous', 'Previous')"
            @click="goPrev"
          />
          <UButton
            variant="soft"
            color="neutral"
            size="xs"
            icon="i-heroicons-chevron-right"
            :disabled="!hasNext"
            :aria-label="tt('ui.actions.next', 'Next')"
            @click="goNext"
          />
          <USeparator direction="vertical" class="h-5 mx-1" />
          <div v-if="loading" class="flex items-center gap-2">
            <USkeleton class="h-5 w-32" />
          </div>
          <template v-else-if="entity">
            <span class="text-sm font-semibold truncate max-w-xs">
              {{ entityName || entityCode || `#${entityId}` }}
            </span>
            <UBadge color="neutral" variant="subtle" size="xs">
              {{ entityLabel }}
            </UBadge>
          </template>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <EntityEditorialIndicator
            v-if="entity"
            :editorial-state="editorialStateInput"
            :allowed-transitions="allowedTransitions"
            :version-semver="entityVersionSemver"
            :release-stage="entityReleaseStage"
            :publish-ready="entityEditorial?.publishReady ?? false"
            compact
          />
        </div>
      </div>
    </header>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <div class="flex flex-col items-center gap-3">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-neutral-400" />
        <span class="text-sm text-neutral-500">{{ tt('ui.states.loading', 'Loading...') }}</span>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="fetchError" class="max-w-xl mx-auto py-12 px-4">
      <UAlert
        color="error"
        icon="i-heroicons-exclamation-triangle"
        :title="tt('ui.notifications.error', 'Error loading entity')"
        :description="errorMessage"
      />
      <div class="mt-4 flex gap-2">
        <UButton color="primary" @click="refreshEntity">
          {{ tt('ui.actions.retry', 'Retry') }}
        </UButton>
        <UButton variant="soft" color="neutral" @click="navigateBack">
          {{ tt('ui.actions.back', 'Back') }}
        </UButton>
      </div>
    </div>

    <!-- Main studio layout -->
    <div v-else-if="entity" class="mx-auto max-w-screen-2xl px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        <!-- Left: Card preview -->
        <div class="flex flex-col items-center gap-4">
          <!-- Card image preview (2:3 ratio) -->
          <div class="relative w-full max-w-sm">
            <div class="aspect-2/3 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 shadow-lg">
              <img
                v-if="entityImage"
                :src="imagePreviewUrl || entityImage"
                :alt="entityName || 'Card preview'"
                class="w-full h-full object-cover"
              >
              <div v-else class="w-full h-full flex flex-col items-center justify-center gap-3 text-neutral-400">
                <UIcon name="i-heroicons-photo" class="h-16 w-16" />
                <span class="text-sm">{{ tt('ui.fields.noImage', 'No image') }}</span>
              </div>
            </div>

            <!-- Image upload overlay -->
            <div class="absolute inset-0 flex items-end justify-center pb-4 opacity-0 hover:opacity-100 transition-opacity">
              <div class="flex gap-2">
                <UButton
                  size="sm"
                  color="primary"
                  variant="solid"
                  icon="i-heroicons-arrow-up-tray"
                  class="shadow-lg"
                  @click="triggerImageUpload"
                >
                  {{ tt('ui.actions.uploadImage', 'Upload') }}
                </UButton>
                <UButton
                  v-if="entityImage"
                  size="sm"
                  color="error"
                  variant="soft"
                  icon="i-heroicons-trash"
                  class="shadow-lg"
                  @click="removeImage"
                >
                  {{ tt('ui.actions.remove', 'Remove') }}
                </UButton>
              </div>
            </div>
            <input
              ref="imageInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onImageFileChange"
            >
          </div>

          <!-- Card info below preview -->
          <div class="w-full max-w-sm space-y-3">
            <WorldBadge :world="resolvedWorld" size="sm" />
            <VersionBadge
              :version-semver="entityVersionSemver"
              :release-stage="entityReleaseStage"
              size="sm"
            />
          </div>

          <!-- Publish readiness checklist -->
          <UCard v-if="entityEditorial" class="w-full max-w-sm">
            <template #header>
              <h3 class="text-sm font-semibold">{{ tt('ui.editorial.publishChecklist', 'Publish readiness') }}</h3>
            </template>
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <UIcon
                  :name="entityName ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="entityName ? 'text-emerald-500' : 'text-red-400'"
                  class="shrink-0"
                />
                <span>{{ tt('ui.editorial.hasName', 'Has name') }}</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon
                  :name="entityImage ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="entityImage ? 'text-emerald-500' : 'text-red-400'"
                  class="shrink-0"
                />
                <span>{{ tt('ui.editorial.hasImage', 'Has image') }}</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon
                  :name="entityDescription ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="entityDescription ? 'text-emerald-500' : 'text-red-400'"
                  class="shrink-0"
                />
                <span>{{ tt('ui.editorial.hasDescription', 'Has description') }}</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon
                  :name="entityEditorial.publishReady ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="entityEditorial.publishReady ? 'text-emerald-500' : 'text-red-400'"
                  class="shrink-0"
                />
                <span>{{ tt('ui.editorial.publishReady', 'Publish ready') }}</span>
              </div>
              <UAlert
                v-if="entityEditorial.blockingReasons?.length"
                color="warning"
                variant="subtle"
                class="mt-2 text-xs"
                :description="entityEditorial.blockingReasons.join('. ')"
              />
            </div>
          </UCard>
        </div>

        <!-- Right: Side panel with tabs -->
        <div class="space-y-4">
          <UCard :ui="{ body: 'p-0' }">
            <UTabs v-model="activeTab" :items="tabItems" :unmount-on-hide="false">
              <template #content="{ item }">
                <div class="p-4">
                  <!-- Metadata tab -->
                  <div v-if="item.value === 'metadata'" class="space-y-4">
                    <UForm :state="basicSection.state" class="space-y-4" @submit.prevent="onSaveBasic">
                      <div class="grid gap-3 sm:grid-cols-2">
                        <UFormField :label="tt('ui.fields.name', 'Name')" required>
                          <UInput v-model="basicSection.state.name" required />
                        </UFormField>
                        <UFormField :label="tt('ui.fields.code', 'Code')">
                          <UInput v-model="basicSection.state.code" />
                        </UFormField>
                      </div>

                      <UFormField :label="tt('ui.fields.shortText', 'Short text')">
                        <UTextarea v-model="basicSection.state.short_text" :rows="2" />
                      </UFormField>

                      <UFormField :label="tt('ui.fields.description', 'Description')">
                        <UTextarea v-model="basicSection.state.description" :rows="4" />
                      </UFormField>

                      <UFormField :label="tt('ui.fields.imageUrl', 'Image URL')">
                        <UInput v-model="basicSection.state.image" type="url" />
                      </UFormField>

                      <div class="flex items-center gap-2">
                        <USwitch v-model="basicSection.state.is_active" size="md" />
                        <span class="text-sm text-neutral-600 dark:text-neutral-300">
                          {{ tt('ui.fields.active', 'Active') }}
                        </span>
                      </div>

                      <div class="flex justify-end gap-2 pt-2">
                        <UButton
                          color="neutral"
                          variant="soft"
                          size="xs"
                          :disabled="!basicSection.dirty.value"
                          @click="basicSection.reset"
                        >
                          {{ tt('ui.actions.reset', 'Reset') }}
                        </UButton>
                        <UButton
                          type="submit"
                          color="primary"
                          size="xs"
                          :loading="basicSection.loading.value"
                          :disabled="!basicSection.dirty.value"
                        >
                          {{ tt('ui.actions.save', 'Save') }}
                        </UButton>
                      </div>
                    </UForm>

                    <!-- Created / Updated by -->
                    <USeparator />
                    <div class="space-y-2 text-xs">
                      <div v-if="entityCreatedBy" class="flex items-center justify-between">
                        <span class="text-muted">{{ tt('ui.fields.createdBy', 'Created by') }}</span>
                        <AvatarWithMeta
                          :username="entityCreatedBy"
                          :date="entityCreatedAt"
                          size="2xs"
                          date-format="short"
                        />
                      </div>
                      <div v-if="editorialStateRaw?.updated_by" class="flex items-center justify-between">
                        <span class="text-muted">{{ tt('ui.fields.updatedBy', 'Updated by') }}</span>
                        <AvatarWithMeta
                          :username="String(editorialStateRaw.updated_by)"
                          :date="editorialStateRaw.modified_at != null ? String(editorialStateRaw.modified_at) : null"
                          size="2xs"
                          date-format="short"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Translations tab -->
                  <div v-else-if="item.value === 'translations'" class="space-y-4">
                    <div class="flex items-center justify-between gap-2">
                      <USelectMenu
                        v-if="translationLocaleItems.length"
                        v-model="selectedTranslationLang"
                        :items="translationLocaleItems"
                        option-attribute="label"
                        value-key="value"
                        size="xs"
                        class="min-w-32"
                      />
                      <StatusBadge
                        v-if="currentTranslationMeta?.status"
                        type="translation"
                        :value="currentTranslationMeta.status"
                        size="xs"
                      />
                    </div>

                    <div v-if="!selectedTranslationLang" class="text-sm text-muted">
                      {{ tt('ui.notifications.noLanguages', 'No additional languages configured') }}
                    </div>

                    <template v-else>
                      <div v-if="showEnglishReference" class="rounded border border-neutral-200 bg-neutral-50 p-3 text-xs dark:border-neutral-700 dark:bg-neutral-800">
                        <p class="font-medium text-neutral-600 dark:text-neutral-200 mb-1">
                          {{ tt('ui.fields.original', 'Original (EN)') }}
                        </p>
                        <p class="text-neutral-600 dark:text-neutral-300">{{ englishTranslation?.name || '—' }}</p>
                        <p class="mt-1 whitespace-pre-wrap text-neutral-500 dark:text-neutral-400 line-clamp-3">
                          {{ englishTranslation?.description || '—' }}
                        </p>
                      </div>

                      <USkeleton v-if="translationLoading" class="h-32 w-full" />
                      <UForm v-else :state="translationSection.state" class="space-y-3" @submit.prevent="onSaveTranslation">
                        <UFormField :label="tt('ui.fields.name', 'Name')" required>
                          <UInput v-model="translationSection.state.name" required />
                        </UFormField>
                        <UFormField :label="tt('ui.fields.shortText', 'Short text')">
                          <UTextarea v-model="translationSection.state.short_text" :rows="2" />
                        </UFormField>
                        <UFormField :label="tt('ui.fields.description', 'Description')">
                          <UTextarea v-model="translationSection.state.description" :rows="4" />
                        </UFormField>
                        <div class="flex justify-end gap-2">
                          <UButton
                            color="neutral"
                            variant="soft"
                            size="xs"
                            :disabled="!translationSection.dirty.value"
                            @click="translationSection.reset"
                          >
                            {{ tt('ui.actions.reset', 'Reset') }}
                          </UButton>
                          <UButton
                            type="submit"
                            color="primary"
                            size="xs"
                            :loading="translationSection.loading.value"
                            :disabled="!translationSection.dirty.value"
                          >
                            {{ tt('ui.actions.save', 'Save') }}
                          </UButton>
                        </div>
                      </UForm>
                    </template>
                  </div>

                  <!-- Editorial tab -->
                  <div v-else-if="item.value === 'editorial'" class="space-y-4">
                    <EditorialWorkflow
                      ref="editorialWorkflowRef"
                      :editorial="entityEditorial"
                      :disabled="saving"
                      @transition="handleEditorialTransition"
                    />
                  </div>

                  <!-- Feedback tab -->
                  <div v-else-if="item.value === 'feedback'" class="space-y-4">
                    <UForm :state="feedbackForm" class="space-y-3" @submit.prevent="submitFeedback">
                      <UFormField :label="tt('ui.fields.category', 'Category')">
                        <USelectMenu
                          v-model="feedbackForm.type"
                          :items="feedbackCategories"
                          option-attribute="label"
                          value-key="value"
                          size="xs"
                        />
                      </UFormField>
                      <UFormField :label="tt('ui.fields.comment', 'Comment')" required>
                        <UTextarea v-model="feedbackForm.comment" :rows="4" required />
                      </UFormField>
                      <div class="flex justify-end">
                        <UButton
                          type="submit"
                          color="primary"
                          size="xs"
                          :loading="feedbackSaving"
                          :disabled="!feedbackForm.comment?.trim()"
                        >
                          {{ tt('ui.actions.submit', 'Submit feedback') }}
                        </UButton>
                      </div>
                    </UForm>
                  </div>

                  <!-- Dependencies tab -->
                  <div v-else-if="item.value === 'dependencies'" class="space-y-3">
                    <UAlert
                      color="neutral"
                      icon="i-heroicons-information-circle"
                      :title="tt('ui.sections.dependencies', 'Dependencies')"
                      :description="tt('ui.sections.dependenciesPlaceholder', 'Dependency tracking will be available in a future update.')"
                    />
                    <div v-if="entityTags.length" class="space-y-2">
                      <h4 class="text-xs font-semibold text-muted uppercase tracking-wide">
                        {{ tt('ui.fields.tags', 'Tags') }}
                      </h4>
                      <div class="flex flex-wrap gap-1">
                        <UBadge
                          v-for="tag in entityTags"
                          :key="tag.id ?? tag.name"
                          color="neutral"
                          variant="subtle"
                          size="xs"
                        >
                          {{ tag.name || tag.code || `#${tag.id}` }}
                        </UBadge>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </UTabs>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { useI18n, useRoute, useRouter, useAsyncData, useToast, useRequestURL } from '#imports'
import EntityEditorialIndicator from '~/components/common/EntityEditorialIndicator.vue'
import type { EditorialStateInput } from '~/components/common/EntityEditorialIndicator.vue'
import VersionBadge from '~/components/common/VersionBadge.vue'
import WorldBadge from '~/components/common/WorldBadge.vue'
import AvatarWithMeta from '~/components/common/AvatarWithMeta.vue'
import StatusBadge from '~/components/common/StatusBadge.vue'
import EditorialWorkflow from '~/components/manage/EditorialWorkflow.vue'
import { useFormSection } from '~/composables/common/useFormSection'
import { useApiFetch } from '~/utils/fetcher'
import type { CardStatus } from '~~/shared/editorial/card-status'

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

type TranslationStatusValue = 'complete' | 'partial' | 'missing'

interface TranslationMetaState {
  hasTranslation: boolean
  isFallback: boolean
  status: TranslationStatusValue
}

interface EditorialMeta {
  status: string
  allowedTransitions: string[]
  publishReady: boolean
  blockingReasons: string[]
}

interface TagItem {
  id?: number | string
  name?: string
  code?: string
}

type TabKey = 'metadata' | 'translations' | 'editorial' | 'feedback' | 'dependencies'

const ENTITY_API_MAP: Record<string, string> = {
  baseCard: '/api/base_card',
  base_card: '/api/base_card',
  cardType: '/api/card_type',
  card_type: '/api/card_type',
  arcana: '/api/arcana',
  facet: '/api/facet',
  skill: '/api/skill',
  world: '/api/world',
  worldCard: '/api/world_card',
  world_card: '/api/world_card',
  tag: '/api/tag',
}

const ENTITY_LABEL_MAP: Record<string, string> = {
  baseCard: 'Base Card',
  base_card: 'Base Card',
  cardType: 'Card Type',
  card_type: 'Card Type',
  arcana: 'Arcana',
  facet: 'Facet',
  skill: 'Skill',
  world: 'World',
  worldCard: 'World Card',
  world_card: 'World Card',
  tag: 'Tag',
}

const FEEDBACK_ENTITY_TYPE_MAP: Record<string, string> = {
  baseCard: 'base_card',
  base_card: 'base_card',
  cardType: 'base_card_type',
  card_type: 'base_card_type',
  arcana: 'arcana',
  facet: 'facet',
  skill: 'base_skills',
  world: 'world',
  worldCard: 'world_card',
  world_card: 'world_card',
}

const DEFAULT_LANG = 'en'

definePageMeta({ layout: 'default' })

const { t, te, locale, availableLocales } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const apiFetch = useApiFetch

function tt(key: string, fallback: string): string {
  return te(key) ? (t(key) as string) : fallback
}

// --- Route params ---
const entityKey = computed(() => {
  const raw = route.params.entity
  return typeof raw === 'string' ? raw : String(raw ?? '')
})

const entityId = computed(() => {
  const raw = route.params.id
  const parsed = typeof raw === 'string' ? Number(raw) : Number(raw ?? NaN)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
})

const apiPath = computed(() => ENTITY_API_MAP[entityKey.value] ?? `/api/${entityKey.value}`)
const entityLabel = computed(() => ENTITY_LABEL_MAP[entityKey.value] ?? entityKey.value)

const localeValue = computed(() => (typeof locale === 'string' ? locale : locale.value) || DEFAULT_LANG)
const availableLocaleList = computed(() => availableLocales?.length ? availableLocales : [DEFAULT_LANG])

// --- Data fetching ---
function resolveApiBase(): string | undefined {
  if (!import.meta.server) return undefined
  const url = useRequestURL()
  return `${url.origin}`
}

const asyncKey = computed(() => `studio:${entityKey.value}:${entityId.value}:${localeValue.value}`)

const { data: entityData, pending: loading, error: fetchError, refresh } = await useAsyncData(
  asyncKey.value,
  async () => {
    if (!entityId.value) return null
    const baseURL = resolveApiBase()
    const response = await apiFetch(`${apiPath.value}/${entityId.value}`, {
      method: 'GET',
      params: { lang: localeValue.value },
      baseURL,
    })
    return (response as Record<string, unknown>)?.data ?? response ?? null
  },
  {
    server: true,
    immediate: true,
    watch: [entityId],
  },
)

const entity = computed(() => entityData.value as Record<string, unknown> | null)
const errorMessage = computed(() => resolveErrorMessage(fetchError.value))
const saving = ref(false)

// --- Typed entity accessors for template ---
const entityName = computed(() => {
  const v = entity.value?.name
  return typeof v === 'string' ? v : ''
})
const entityCode = computed(() => {
  const v = entity.value?.code
  return typeof v === 'string' ? v : ''
})
const entityImage = computed(() => {
  const v = entity.value?.image
  return typeof v === 'string' ? v : null
})
const entityDescription = computed(() => {
  const v = entity.value?.description
  return typeof v === 'string' ? v : null
})
const entityVersionSemver = computed((): string | null => {
  const v = entity.value?.version_semver
  return typeof v === 'string' ? v : null
})
const entityReleaseStage = computed(() => {
  const v = entity.value?.release_stage
  return typeof v === 'string' ? v as 'dev' | 'beta' | 'candidate' | 'release' | 'revision' | 'alfa' : null
})
const _entityStatus = computed(() => {
  const v = entity.value?.status
  return typeof v === 'string' ? v : 'draft'
})
const entityCreatedBy = computed(() => {
  const v = entity.value?.create_user ?? entity.value?.created_by
  return v != null ? String(v) : null
})
const entityCreatedAt = computed(() => {
  const v = entity.value?.created_at
  return typeof v === 'string' ? v : null
})
const entityTags = computed((): TagItem[] => {
  const v = entity.value?.tags
  return Array.isArray(v) ? v as TagItem[] : []
})

async function refreshEntity() {
  await refresh()
}

// --- Editorial state ---
const editorialStateRaw = computed(() => {
  const es = (entity.value as Record<string, unknown> | null)?.editorial_state
  if (!es || typeof es !== 'object') return null
  return es as Record<string, unknown>
})

const editorialStateInput = computed<EditorialStateInput | null>(() => {
  if (!editorialStateRaw.value) {
    const status = entity.value?.status
    if (typeof status === 'string') return { status }
    return null
  }
  return {
    status: String(editorialStateRaw.value.status ?? entity.value?.status ?? 'draft'),
    updated_by: editorialStateRaw.value.updated_by != null ? String(editorialStateRaw.value.updated_by) : null,
    updated_at: editorialStateRaw.value.modified_at != null ? String(editorialStateRaw.value.modified_at) : null,
    content_version_id: typeof editorialStateRaw.value.content_version_id === 'number' ? editorialStateRaw.value.content_version_id : null,
  }
})

const entityEditorial = computed<EditorialMeta | null>(() => {
  const editorial = (entity.value as Record<string, unknown> | null)?.editorial
  if (!editorial || typeof editorial !== 'object') return null
  const ed = editorial as Record<string, unknown>
  if (typeof ed.status !== 'string') return null
  return {
    status: ed.status,
    allowedTransitions: Array.isArray(ed.allowedTransitions) ? ed.allowedTransitions as string[] : [],
    publishReady: Boolean(ed.publishReady),
    blockingReasons: Array.isArray(ed.blockingReasons) ? ed.blockingReasons as string[] : [],
  }
})

const allowedTransitions = computed<CardStatus[]>(() => {
  return (entityEditorial.value?.allowedTransitions ?? []) as CardStatus[]
})

// --- World ---
const resolvedWorld = computed(() => {
  const worldId = entity.value?.world_id
  if (typeof worldId !== 'number' || worldId <= 0) return null
  const worldName = typeof entity.value?.world_name === 'string' ? entity.value.world_name : `World #${worldId}`
  return { id: worldId, name: worldName as string }
})

// --- Tabs ---
const activeTab = ref<TabKey>('metadata')

const tabItems = computed(() => [
  { label: tt('ui.sections.metadata', 'Metadata'), value: 'metadata' as TabKey, icon: 'i-heroicons-document-text' },
  { label: tt('ui.sections.translations', 'Translations'), value: 'translations' as TabKey, icon: 'i-heroicons-language' },
  { label: tt('ui.sections.editorial', 'Editorial'), value: 'editorial' as TabKey, icon: 'i-heroicons-clipboard-document-check' },
  { label: tt('ui.sections.feedback', 'Feedback'), value: 'feedback' as TabKey, icon: 'i-heroicons-chat-bubble-left-right' },
  { label: tt('ui.sections.dependencies', 'Dependencies'), value: 'dependencies' as TabKey, icon: 'i-heroicons-link' },
])

// --- Basic form section ---
const basicBaseline = ref<BasicFormState>(createEmptyBasicState())

const basicSection = useFormSection<BasicFormState>(
  computed(() => basicBaseline.value),
  {
    onSave: async (state) => {
      const diff = diffState(state, basicBaseline.value)
      if (!Object.keys(diff).length) return { success: true }
      saving.value = true
      try {
        await apiFetch(`${apiPath.value}/${entityId.value}`, {
          method: 'PATCH',
          body: { ...diff, lang: DEFAULT_LANG },
        })
        basicBaseline.value = clone({ ...basicBaseline.value, ...diff })
        toast.add({ title: tt('ui.notifications.saved', 'Changes saved'), color: 'success' })
        await refreshEntity()
        return { success: true }
      } catch (err: unknown) {
        const message = resolveErrorMessage(err)
        toast.add({ title: tt('ui.notifications.error', 'Error'), description: message, color: 'error' })
        return { success: false, message }
      } finally {
        saving.value = false
      }
    },
  },
)

// --- Translation section ---
const translationBaseline = ref<TranslationFormState>(createEmptyTranslationState(localeValue.value))
const translationCache = reactive<Record<string, TranslationFormState>>({})
const translationMeta = reactive<Record<string, TranslationMetaState>>({})
const translationLoading = ref(false)
const selectedTranslationLang = ref<string | undefined>(undefined)

const translationLocales = computed(() => availableLocaleList.value.filter(code => code !== DEFAULT_LANG))
const translationLocaleItems = computed(() => translationLocales.value.map(code => ({ value: code, label: code.toUpperCase() })))

const translationSection = useFormSection<TranslationFormState>(
  computed(() => translationBaseline.value),
  {
    onSave: async (state) => {
      const diff = diffState(state, translationBaseline.value, ['lang'])
      if (!Object.keys(diff).length) return { success: true }
      saving.value = true
      try {
        await apiFetch(`${apiPath.value}/${entityId.value}`, {
          method: 'PATCH',
          body: { ...diff, lang: state.lang },
        })
        translationCache[state.lang] = clone({ ...translationBaseline.value, ...diff })
        translationBaseline.value = clone({ ...translationBaseline.value, ...diff })
        translationMeta[state.lang] = buildTranslationMeta(
          Boolean((translationCache[state.lang]?.name ?? '').trim()),
          false,
        )
        toast.add({ title: tt('ui.notifications.saved', 'Changes saved'), color: 'success' })
        await refreshEntity()
        return { success: true }
      } catch (err: unknown) {
        const message = resolveErrorMessage(err)
        toast.add({ title: tt('ui.notifications.error', 'Error'), description: message, color: 'error' })
        return { success: false, message }
      } finally {
        saving.value = false
      }
    },
  },
)

const currentTranslationMeta = computed(() => {
  const lang = selectedTranslationLang.value || DEFAULT_LANG
  return translationMeta[lang] ?? null
})

const showEnglishReference = computed(() => {
  const lang = selectedTranslationLang.value
  return Boolean(lang && lang !== DEFAULT_LANG && englishTranslation.value)
})

const englishTranslation = computed(() => translationCache[DEFAULT_LANG] ?? null)

// --- Editorial transitions ---
const editorialWorkflowRef = ref<{ setError: (msg: string) => void; clearError: () => void } | null>(null)

async function handleEditorialTransition(nextStatus: string) {
  saving.value = true
  try {
    await apiFetch(`${apiPath.value}/${entityId.value}`, {
      method: 'PATCH',
      body: { status: nextStatus, lang: DEFAULT_LANG },
    })
    toast.add({ title: tt('ui.notifications.saved', 'Status updated'), color: 'success' })
    await refreshEntity()
    editorialWorkflowRef.value?.clearError()
  } catch (err: unknown) {
    const message = resolveErrorMessage(err)
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: message, color: 'error' })
    editorialWorkflowRef.value?.setError(message)
  } finally {
    saving.value = false
  }
}

// --- Feedback ---
const feedbackForm = reactive({
  type: 'bug' as string,
  comment: '',
})
const feedbackSaving = ref(false)

const feedbackCategories = [
  { value: 'bug', label: 'Bug' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'balance', label: 'Balance' },
  { value: 'translation', label: 'Translation' },
  { value: 'other', label: 'Other' },
]

async function submitFeedback() {
  if (!feedbackForm.comment?.trim() || !entityId.value || feedbackSaving.value) return
  feedbackSaving.value = true
  try {
    const feedbackEntityType = FEEDBACK_ENTITY_TYPE_MAP[entityKey.value] ?? entityKey.value
    await apiFetch('/api/content_feedback', {
      method: 'POST',
      body: {
        entity_type: feedbackEntityType,
        entity_id: entityId.value,
        comment: feedbackForm.comment.trim(),
        category: feedbackForm.type,
        status: 'open',
      },
    })
    toast.add({ title: tt('ui.notifications.saved', 'Feedback submitted'), color: 'success' })
    feedbackForm.comment = ''
  } catch (err: unknown) {
    const message = resolveErrorMessage(err)
    toast.add({ title: tt('ui.notifications.error', 'Error'), description: message, color: 'error' })
  } finally {
    feedbackSaving.value = false
  }
}

// --- Image upload ---
const imageInputRef = ref<HTMLInputElement | null>(null)
const imagePreviewUrl = ref<string | null>(null)

function triggerImageUpload() {
  imageInputRef.value?.click()
}

async function onImageFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  imagePreviewUrl.value = URL.createObjectURL(file)

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await apiFetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    }) as Record<string, unknown>
    const url = (response?.data as Record<string, unknown>)?.url ?? response?.url
    if (typeof url === 'string') {
      basicSection.patch({ image: url })
      await basicSection.save()
    }
  } catch (err: unknown) {
    const message = resolveErrorMessage(err)
    toast.add({ title: tt('ui.notifications.error', 'Upload failed'), description: message, color: 'error' })
    imagePreviewUrl.value = null
  }

  target.value = ''
}

async function removeImage() {
  basicSection.patch({ image: null })
  imagePreviewUrl.value = null
  await basicSection.save()
}

// --- Navigation ---
const hasPrev = computed(() => {
  const ids = getNeighborIds()
  return ids.prevId !== null
})

const hasNext = computed(() => {
  const ids = getNeighborIds()
  return ids.nextId !== null
})

function getNeighborIds(): { prevId: number | null; nextId: number | null } {
  const listRaw = sessionStorage?.getItem?.(`studio:${entityKey.value}:ids`)
  if (!listRaw) return { prevId: null, nextId: null }
  try {
    const ids = JSON.parse(listRaw) as number[]
    if (!Array.isArray(ids) || !entityId.value) return { prevId: null, nextId: null }
    const idx = ids.indexOf(entityId.value)
    if (idx < 0) return { prevId: null, nextId: null }
    return {
      prevId: idx > 0 ? (ids[idx - 1] ?? null) : null,
      nextId: idx < ids.length - 1 ? (ids[idx + 1] ?? null) : null,
    }
  } catch {
    return { prevId: null, nextId: null }
  }
}

function goPrev() {
  const { prevId } = getNeighborIds()
  if (prevId !== null) {
    router.push(`/manage/${entityKey.value}/${prevId}/studio`)
  }
}

function goNext() {
  const { nextId } = getNeighborIds()
  if (nextId !== null) {
    router.push(`/manage/${entityKey.value}/${nextId}/studio`)
  }
}

function navigateBack() {
  router.push('/manage')
}

// --- Watchers ---
watch(translationLocales, (locales) => {
  if (!locales.length) {
    selectedTranslationLang.value = undefined
    return
  }
  if (!selectedTranslationLang.value || !locales.includes(selectedTranslationLang.value)) {
    const preferred = locales.includes(localeValue.value) ? localeValue.value : locales[0]
    selectedTranslationLang.value = preferred ?? undefined
  }
}, { immediate: true })

watchEffect(() => {
  if (!entity.value) return
  const raw = entity.value as Record<string, unknown>
  const basic = buildBasicState(raw)
  if (!basicSection.dirty.value) {
    basicSection.patch(basic)
    basicBaseline.value = clone(basic)
  }

  const defaultTranslation = buildTranslationState(raw, DEFAULT_LANG)
  translationCache[DEFAULT_LANG] = clone(defaultTranslation)
  translationMeta[DEFAULT_LANG] = buildTranslationMeta(
    Boolean((defaultTranslation.name ?? '').trim()),
    Boolean(raw.language_is_fallback),
  )
  if (!translationSection.dirty.value) {
    translationBaseline.value = clone(defaultTranslation)
  }
})

watch(
  () => selectedTranslationLang.value,
  async (lang) => {
    if (!lang || lang === DEFAULT_LANG) return
    if (translationCache[lang]) {
      translationBaseline.value = clone(translationCache[lang])
      if (!translationSection.dirty.value) translationSection.patch(translationCache[lang])
      return
    }

    translationLoading.value = true
    try {
      const response = await apiFetch(`${apiPath.value}/${entityId.value}`, {
        method: 'GET',
        params: { lang },
      })
      const data = ((response as Record<string, unknown>)?.data ?? {}) as Record<string, unknown>
      const state = buildTranslationState(data, lang)
      translationCache[lang] = clone(state)
      translationMeta[lang] = buildTranslationMeta(
        Boolean((state.name ?? '').trim()),
        Boolean(data.language_is_fallback),
      )
      translationBaseline.value = clone(state)
    } catch (err: unknown) {
      if (!isNotFoundError(err)) {
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
  },
  { immediate: true },
)

// --- Helpers ---
function onSaveBasic() {
  void basicSection.save()
}

function onSaveTranslation() {
  void translationSection.save()
}

function createEmptyBasicState(): BasicFormState {
  return { name: '', code: '', short_text: null, description: null, status: 'draft', is_active: true, image: null }
}

function buildBasicState(raw: Record<string, unknown>): BasicFormState {
  return {
    name: typeof raw.name === 'string' ? raw.name : '',
    code: typeof raw.code === 'string' ? raw.code : '',
    short_text: typeof raw.short_text === 'string' ? raw.short_text : null,
    description: typeof raw.description === 'string' ? raw.description : null,
    status: typeof raw.status === 'string' ? raw.status : 'draft',
    is_active: typeof raw.is_active === 'boolean' ? raw.is_active : true,
    image: typeof raw.image === 'string' ? raw.image : null,
  }
}

function createEmptyTranslationState(lang: string): TranslationFormState {
  return { lang, name: '', short_text: null, description: null }
}

function buildTranslationState(raw: Record<string, unknown>, lang: string): TranslationFormState {
  return {
    lang,
    name: typeof raw.name === 'string' ? raw.name : '',
    short_text: typeof raw.short_text === 'string' ? raw.short_text : null,
    description: typeof raw.description === 'string' ? raw.description : null,
  }
}

function buildTranslationMeta(hasTranslation: boolean, isFallback: boolean): TranslationMetaState {
  let status: TranslationStatusValue
  if (!hasTranslation) status = 'missing'
  else if (isFallback) status = 'partial'
  else status = 'complete'
  return { hasTranslation, isFallback, status }
}

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try { return structuredClone(value) } catch { /* noop */ }
  }
  return JSON.parse(JSON.stringify(value)) as T
}

function diffState<T extends Record<string, unknown>>(current: T, baseline: T, exclude: string[] = []): Partial<T> {
  const result: Partial<T> = {}
  for (const key of Object.keys(current)) {
    if (exclude.includes(key)) continue
    if (!deepEqual(current[key], baseline[key])) {
      result[key as keyof T] = clone(current[key]) as T[keyof T]
    }
  }
  return result
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => deepEqual(item, b[index]))
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>
    const aKeys = Object.keys(aObj)
    const bKeys = Object.keys(bObj)
    if (aKeys.length !== bKeys.length) return false
    for (const key of aKeys) {
      if (!deepEqual(aObj[key], bObj[key])) return false
    }
    return true
  }
  return false
}

function resolveErrorMessage(err: unknown): string {
  if (!err) return ''
  const e = err as Record<string, unknown>
  const data = e.data as Record<string, unknown> | undefined
  return String(data?.message ?? e.message ?? tt('ui.notifications.errorGeneric', 'Unexpected error'))
}

function isNotFoundError(err: unknown): boolean {
  const e = err as Record<string, unknown>
  const status = e?.status ?? (e?.response as Record<string, unknown>)?.status
  const statusCode = (e?.data as Record<string, unknown>)?.statusCode ?? e?.statusCode
  return status === 404 || statusCode === 404
}
</script>
