<!-- app/components/admin/VersionModal.vue -->
<template>
  <UModal
    v-model:open="open"
    :title="isEdit ? tt('versions.editTitle', 'Edit version') : tt('versions.createTitle', 'Create version')"
    :description="tt('versions.modalDescription', 'Provide version information and optional metadata')"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ tt('versions.version', 'Version (semver)') }}</label>
          <UInput v-model="form.version_semver" placeholder="1.0.0" @input="validateSemver" />
          <p v-if="semverError" class="text-xs mt-1 text-error">{{ semverError }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ tt('common.description', 'Description') }}</label>
          <UTextarea v-model="form.description" :rows="3" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ tt('versions.release.label', 'Release type') }}</label>
          <USelectMenu
            v-model="form.release"
            :items="releaseItems"
            value-key="value"
            option-attribute="label"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ tt('common.metadata', 'Metadata (JSON)') }}</label>
          <UTextarea v-model="form.metadataText" :rows="6" placeholder='{"key":"value"}' />
          <p v-if="metaError" class="text-xs text-error mt-1">{{ metaError }}</p>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="soft" color="neutral" :label="tt('common.cancel', 'Cancel')" @click="close" />
        <UButton color="primary" :label="tt('common.save', 'Save')" :loading="saving" :disabled="Boolean(semverError)" @click="submit" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { t, te } = useI18n()
function tt(key: string, fallback: string) { return te(key) ? t(key) : fallback }

const open = defineModel<boolean>({ default: false })

const props = defineProps<{ value?: any | null }>()
const emit = defineEmits<{ (e:'save', payload: { id?: number; version_semver: string; description?: string | null; metadata?: Record<string, any>; release: ReleaseStage }): void }>()

type ReleaseStage = 'dev' | 'alfa' | 'beta' | 'candidate' | 'release' | 'revision'

const releaseStages: ReleaseStage[] = ['dev', 'alfa', 'beta', 'candidate', 'release', 'revision']
const releaseItems = computed(() => releaseStages.map((stage) => ({
  value: stage,
  label: tt(`versions.release.${stage}`, stage.charAt(0).toUpperCase() + stage.slice(1))
})))

const isEdit = computed(() => Boolean(props.value && props.value.id))

const form = reactive<{ id?: number; version_semver: string; description?: string | null; metadata?: Record<string, any> | null; metadataText: string; release: ReleaseStage }>({
  id: props.value?.id,
  version_semver: props.value?.version_semver || '',
  description: props.value?.description || '',
  metadata: props.value?.metadata || {},
  metadataText: JSON.stringify(props.value?.metadata ?? {}, null, 2),
  release: props.value?.release || 'alfa'
})

watch(() => props.value, (v) => {
  form.id = v?.id
  form.version_semver = v?.version_semver || ''
  form.description = v?.description || ''
  form.metadata = v?.metadata || {}
  form.metadataText = JSON.stringify(form.metadata ?? {}, null, 2)
  form.release = v?.release || 'alfa'
})

const saving = ref(false)
const metaError = ref<string | null>(null)
const semverError = ref<string | null>(null)
function close() { open.value = false }
async function submit() {
  validateSemver()
  if (semverError.value) return
  // parse metadata JSON
  let parsed: Record<string, any> | undefined
  metaError.value = null
  if (form.metadataText && form.metadataText.trim()) {
    try {
      parsed = JSON.parse(form.metadataText)
    } catch (e: any) {
      metaError.value = tt('versions.invalidMetadata', 'Invalid JSON in metadata')
      return
    }
  }
  saving.value = true
  emit('save', {
    id: form.id,
    version_semver: form.version_semver.trim(),
    description: form.description?.trim() || null,
    metadata: parsed ?? {},
    release: form.release
  })
  saving.value = false
  close()
}

function validateSemver() {
  const value = form.version_semver?.trim() || ''
  const re = /^\d+\.\d+\.\d+(?:\.\d+)?$/
  if (!value) {
    semverError.value = tt('versions.semverRequired', 'Version is required')
  } else if (!re.test(value)) {
    semverError.value = tt('versions.semverInvalid', 'Invalid version format. Use MAJOR.MINOR.PATCH[.BUILD]')
  } else {
    semverError.value = null
  }
}
</script>
