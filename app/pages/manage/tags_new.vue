<!-- app/pages/manage/tags_new.vue -->
<template>
  <div class="px-4 pb-10 space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
          {{ pageTitle }}
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          {{ pageSubtitle }}
        </p>
      </div>

      <UButton
        color="neutral"
        variant="soft"
        size="sm"
        icon="i-heroicons-arrow-left"
        @click="goBack"
      >
        {{ tt('ui.actions.back', 'Back') }}
      </UButton>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div class="space-y-1">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {{ tt('domains.tag.form.title', 'Tag details') }}
            </h2>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              {{ tt('domains.tag.form.subtitle', 'Provide the default (English) information for the new tag.') }}
            </p>
          </div>

          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-heroicons-arrow-path"
            :disabled="submitLoading"
            @click="resetForm"
          >
            {{ tt('ui.actions.reset', 'Reset') }}
          </UButton>
        </div>
      </template>

      <div class="space-y-6">
        <UAlert
          v-if="formError"
          color="error"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          :title="tt('ui.notifications.error', 'There was a problem saving the tag')"
          :description="formError"
        />

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField :label="tt('fields.code', 'Code')" :error="fieldErrorsState.code" required>
              <UInput
                v-model="form.code"
                :disabled="submitLoading"
                autocomplete="off"
              />
            </UFormField>

            <UFormField :label="tt('entities.tag.category', 'Category')" :error="fieldErrorsState.category" required>
              <UInput
                v-model="form.category"
                :disabled="submitLoading"
                autocomplete="off"
              />
            </UFormField>

            <UFormField :label="tt('fields.name', 'Name')" :error="fieldErrorsState.name" required>
              <UInput
                v-model="form.name"
                :disabled="submitLoading"
                autocomplete="off"
              />
            </UFormField>

            <UFormField :label="tt('entities.tag.parent', 'Parent tag')" :description="tt('domains.tag.form.parentHint', 'Select an optional parent to build hierarchies.')" :error="fieldErrorsState.parent_id">
              <USelectMenu
                v-model="form.parent_id"
                :items="parentOptions"
                :loading="loadingParents"
                value-key="value"
                option-attribute="label"
                searchable
                clearable
                :disabled="submitLoading"
                :placeholder="tt('domains.tag.form.parentPlaceholder', 'No parent')"
              />
            </UFormField>

            <UFormField :label="tt('common.sort', 'Sort order')" :error="fieldErrorsState.sort">
              <UInput
                v-model.number="form.sort"
                type="number"
                :disabled="submitLoading"
                min="0"
              />
            </UFormField>

            <div class="flex items-center gap-3 pt-6">
              <USwitch v-model="form.is_active" :disabled="submitLoading" />
              <span class="text-sm text-neutral-600 dark:text-neutral-300">
                {{ tt('ui.states.active', 'Active') }}
              </span>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <UFormField :label="tt('common.short_text', 'Short text')" :error="fieldErrorsState.short_text">
              <UTextarea
                v-model="form.short_text"
                :disabled="submitLoading"
                :rows="3"
                :maxlength="1000"
              />
            </UFormField>

            <UFormField :label="tt('ui.fields.description', 'Description')" :error="fieldErrorsState.description">
              <UTextarea
                v-model="form.description"
                :disabled="submitLoading"
                :rows="5"
                :maxlength="10000"
              />
            </UFormField>
          </div>

          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="soft"
              :disabled="submitLoading"
              @click.prevent="goBack"
            >
              {{ tt('ui.actions.cancel', 'Cancel') }}
            </UButton>

            <UButton
              type="submit"
              color="primary"
              :loading="submitLoading"
              :disabled="submitLoading || !isFormValid"
            >
              {{ tt('ui.actions.save', 'Save') }}
            </UButton>
          </div>
        </form>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n, useRouter, useToast } from '#imports'
import { ZodError } from 'zod'
import { useApiFetch } from '@/utils/fetcher'
import { useEntityFormPreset } from '~/composables/manage/useEntityFormPreset'
import { getErrorMessage } from '@/utils/error'

interface ParentOption {
  label: string
  value: number
}

// Tag item from API
interface TagItem {
  id?: number
  code?: string
  name?: string
}

const { t, te, locale } = useI18n()
const router = useRouter()
const toast = useToast()
const apiFetch = useApiFetch

function tt(key: string, fallback: string): string {
  return te(key) ? (t(key) as string) : fallback
}

const localeCode = computed(() => (typeof locale === 'string' ? locale : locale.value) || 'en')

const { defaults, schema } = useEntityFormPreset(() => 'tag')

const form = reactive({
  code: '',
  category: '',
  name: '',
  short_text: '' as string | null,
  description: '' as string | null,
  parent_id: null as number | null,
  is_active: true,
  sort: null as number | null,
})

watch(defaults, (value) => {
  if (!value) return
  Object.assign(form, {
    code: value.code ?? '',
    category: value.category ?? '',
    name: value.name ?? '',
    short_text: value.short_text ?? '',
    description: value.description ?? '',
    parent_id: value.parent_id ?? null,
    is_active: value.is_active ?? true,
    sort: value.sort ?? null,
  })
}, { immediate: true })

const parentOptions = ref<ParentOption[]>([])
const loadingParents = ref(false)
const submitLoading = ref(false)
const formError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const fieldErrorsState = computed(() => fieldErrors.value)

const isFormValid = computed(() => {
  return Boolean(form.code?.trim() && form.category?.trim() && form.name?.trim())
})

function unwrapTagList(raw: unknown): TagItem[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as TagItem[]
  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.data)) return obj.data as TagItem[]
  if (Array.isArray(obj.items)) return obj.items as TagItem[]
  if (Array.isArray(obj.results)) return obj.results as TagItem[]
  return []
}

async function loadParentOptions() {
  loadingParents.value = true
  try {
    const response = await apiFetch('/tag', {
      method: 'GET',
      params: {
        pageSize: 200,
        lang: localeCode.value,
        parent_only: true,
      },
    })
    const entries = unwrapTagList(response)
    parentOptions.value = entries
      .map((item) => {
        const id = Number(item?.id)
        if (!Number.isFinite(id)) return null
        const label = item?.name || item?.code || `#${id}`
        return { value: id, label } as ParentOption
      })
      .filter((option): option is ParentOption => Boolean(option))
  } catch (_err) {
    // Failed to load parent tags
  } finally {
    loadingParents.value = false
  }
}

watch(localeCode, () => {
  loadParentOptions()
}, { immediate: true })

function sanitizePayload() {
  const shortText = typeof form.short_text === 'string' ? form.short_text.trim() : ''
  const description = typeof form.description === 'string' ? form.description.trim() : ''

  return {
    code: form.code.trim(),
    category: form.category.trim(),
    name: form.name.trim(),
    short_text: shortText.length ? shortText : null,
    description: description.length ? description : null,
    parent_id: form.parent_id ? Number(form.parent_id) : null,
    is_active: Boolean(form.is_active),
    sort: form.sort ?? null,
  }
}

function resetForm() {
  fieldErrors.value = {}
  formError.value = null
  Object.assign(form, {
    code: '',
    category: '',
    name: '',
    short_text: '',
    description: '',
    parent_id: null,
    is_active: true,
    sort: null,
  })
}

function goBack() {
  router.push('/manage')
}

async function handleSubmit() {
  fieldErrors.value = {}
  formError.value = null

  const payload = sanitizePayload()

  try {
    const createSchema = schema.value?.create
    if (createSchema) {
      createSchema.parse(payload)
    }
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      const flat = err.flatten()
      const mapped: Record<string, string> = {}
      for (const [key, messages] of Object.entries(flat.fieldErrors)) {
        if (messages && messages.length) mapped[key] = messages[0]
      }
      fieldErrors.value = mapped
      formError.value = flat.formErrors?.[0] || tt('errors.validation_failed', 'Please review the highlighted fields and try again.')
      return
    }
    formError.value = getErrorMessage(err)
    return
  }

  submitLoading.value = true
  try {
    await apiFetch('/tag', {
      method: 'POST',
      params: { lang: localeCode.value },
      body: payload,
    })

    toast.add?.({
      title: tt('common.saved', 'Saved'),
      description: tt('domains.tag.form.success', 'The tag has been created successfully.'),
      color: 'success',
    })

    router.push('/manage')
  } catch (err: unknown) {
    formError.value = getErrorMessage(err, tt('errors.update_failed', 'Unable to save the tag right now.'))
  } finally {
    submitLoading.value = false
  }
}

const pageTitle = computed(() => tt('domains.tag.create.title', 'Create tag'))
const pageSubtitle = computed(() => tt('domains.tag.create.subtitle', 'Tags help classify and filter content across the application.'))
</script>

