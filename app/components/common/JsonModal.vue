<!-- app/components/common/JsonModal.vue -->
<template>
  <UModal
    v-model:open="open"
    :title="resolvedTitle"
    :description="description || ''"
    size="xl"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <UBadge variant="outline" size="xs" color="neutral">
              {{ modeLabel }}
            </UBadge>
            <span v-if="dirty" class="text-warning-500 dark:text-warning-400">
              {{ tt('ui.labels.unsavedChanges', 'Unsaved changes') }}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UButton
              v-if="allowDownload"
              size="xs"
              variant="soft"
              color="neutral"
              icon="i-heroicons-arrow-down-tray"
              :label="tt('ui.actions.download', 'Download')"
              @click="handleDownload"
            />
            <UButton
              size="xs"
              variant="soft"
              color="neutral"
              icon="i-heroicons-clipboard"
              :label="copyLabel"
              @click="handleCopy"
            />
            <UButton
              v-if="editable"
              size="xs"
              variant="ghost"
              color="primary"
              :icon="isEditing ? 'i-heroicons-eye' : 'i-heroicons-pencil-square'"
              :label="isEditing ? tt('ui.actions.view', 'View') : tt('ui.actions.edit', 'Edit')"
              @click="toggleMode"
            />
          </div>
        </div>

        <div v-if="isEditing" class="flex flex-col gap-2">
          <UTextarea
            v-model="editorValue"
            :rows="editorRows"
            class="font-mono text-xs"
            :placeholder="tt('ui.placeholders.json', 'Write JSON...')"
          />
          <div class="flex flex-wrap items-center justify-end gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
            <span>⌘/Ctrl + S → {{ tt('ui.actions.save', 'Save') }}</span>
            <span>⌘/Ctrl + W → {{ tt('ui.actions.close', 'Close') }}</span>
          </div>
        </div>

        <pre
          v-else
          class="max-h-[60vh] overflow-auto rounded border border-neutral-200 bg-neutral-50 p-4 text-xs font-mono leading-relaxed dark:border-neutral-700 dark:bg-neutral-900"
        ><code>{{ prettyValue }}</code></pre>
      </div>
    </template>

    <template v-if="editable" #footer>
      <div class="flex justify-end gap-2">
        <UButton
          v-if="dirty"
          size="sm"
          variant="soft"
          color="neutral"
          :label="tt('ui.actions.revert', 'Revert')"
          @click="resetEditor"
        />
        <UButton
          size="sm"
          color="primary"
          :label="tt('ui.actions.save', 'Save')"
          :loading="saving"
          @click="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { useI18n } from '#imports'
import { useClipboard, useEventListener } from '@vueuse/core'

const open = defineModel<boolean>({ default: false })

const props = withDefaults(
  defineProps<{
    value?: any
    title?: string
    description?: string
    copyLabel?: string
    editable?: boolean
    autoEdit?: boolean
    allowDownload?: boolean
    filename?: string
  }>(),
  {
    value: undefined,
    title: 'JSON',
    description: '',
    copyLabel: 'Copy',
    editable: false,
    autoEdit: false,
    allowDownload: true,
    filename: 'payload.json',
  },
)

const emit = defineEmits<{
  (e: 'save', value: any): void
  (e: 'update:value', value: any): void
}>()

const { t } = useI18n()
const { copy: copyToClipboard } = useClipboard()

function tt(key: string, fallback: string) {
  const translated = t(key)
  return translated === key ? fallback : (translated as string)
}

const isEditing = ref(Boolean(props.editable && props.autoEdit))
const saving = ref(false)
const editorValue = ref('')

const resolvedTitle = computed(() => props.title || 'JSON')
const copyLabel = computed(() => props.copyLabel || tt('ui.actions.copy', 'Copy'))

const prettyValue = computed(() => {
  try {
    return JSON.stringify(props.value ?? {}, null, 2)
  } catch {
    return String(props.value ?? '')
  }
})

const dirty = computed(() => isEditing.value && editorValue.value.trim() !== prettyValue.value.trim())

const modeLabel = computed(() => (isEditing.value ? tt('ui.labels.editMode', 'Edit mode') : tt('ui.labels.readOnly', 'Read only')))

const editorRows = computed(() => {
  const lines = editorValue.value.split('\n').length
  return Math.min(Math.max(lines, 12), 36)
})

function syncEditor() {
  editorValue.value = prettyValue.value
}

watch(
  () => props.value,
  () => {
    if (!dirty.value) {
      syncEditor()
    }
  },
  { immediate: true },
)

watch(open, (value) => {
  if (value) {
    syncEditor()
    startListening()
  } else {
    stopListening()
  }
})

const shortcutCleanup = ref<(() => void) | null>(null)

function startListening() {
  if (!process.client || shortcutCleanup.value) return
  const stop = useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if (!(event.metaKey || event.ctrlKey)) return
    if (event.key === 's') {
      event.preventDefault()
      if (isEditing.value) handleSave()
    }
    if (event.key === 'w') {
      event.preventDefault()
      open.value = false
    }
  })
  shortcutCleanup.value = stop
}

function stopListening() {
  shortcutCleanup.value?.()
  shortcutCleanup.value = null
}

onBeforeUnmount(stopListening)

function toggleMode() {
  if (!props.editable) return
  if (!isEditing.value) syncEditor()
  isEditing.value = !isEditing.value
}

async function handleCopy() {
  try {
    const source = isEditing.value ? editorValue.value : prettyValue.value
    await copyToClipboard(source)
  } catch {
    // ignore copy error
  }
}

function resetEditor() {
  syncEditor()
}

async function handleSave() {
  if (!props.editable) return
  saving.value = true
  try {
    const parsed = JSON.parse(editorValue.value)
    emit('update:value', parsed)
    emit('save', parsed)
    syncEditor()
    isEditing.value = false
  } catch (error) {
    console.error('[JsonModal] Failed to parse JSON', error)
  } finally {
    saving.value = false
  }
}

function handleDownload() {
  if (!props.allowDownload || !process.client) return
  try {
    const blob = new Blob([isEditing.value ? editorValue.value : prettyValue.value], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = props.filename || 'payload.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('[JsonModal] Failed to download JSON', error)
  }
}

defineExpose({ toggleMode, handleSave })
</script>
