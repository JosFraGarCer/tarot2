<!-- app/components/admin/FeedbackNotesModal.vue -->
<template>
  <UModal
    :open="open"
    :title="modalTitle"
    :description="modalDescription"
    @update:open="handleOpenUpdate"
  >
    <template #title>
      <span class="text-lg font-semibold text-gray-900 dark:text-white">{{ modalTitle }}</span>
    </template>

    <template #description>
      <span class="text-sm text-gray-600 dark:text-gray-300">{{ modalDescription }}</span>
    </template>

    <template #body>
      <div class="space-y-3">
        <div v-if="notesList.length === 0" class="text-sm text-gray-500">{{ $t('features.admin.feedback.notes.empty','No internal notes yet') }}</div>
        <div v-else class="max-h-64 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-800 rounded border border-gray-200 dark:border-gray-800" role="log" aria-live="polite">
          <div v-for="(n, idx) in notesList" :key="idx" class="p-2 text-sm">
            <pre class="whitespace-pre-wrap font-sans text-xs leading-5">{{ n }}</pre>
          </div>
        </div>
        <div v-if="isEditor" class="space-y-2">
          <UTextarea
            :id="noteFieldId"
            ref="noteFieldRef"
            v-model="newNote"
            class="w-full"
            :rows="5"
            :placeholder="$t('features.admin.feedback.notes.addNote','Add note')"
            aria-describedby="noteHelpId"
          />
          <p :id="noteHelpId" class="sr-only">{{ $t('features.admin.feedback.notes.addNote','Add note') }}</p>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton ref="cancelButtonRef" variant="soft" @click="emit('update:open', false)">{{ $t('ui.actions.cancel','Cancel') }}</UButton>
        <UButton v-if="isEditor" color="primary" :disabled="saving || newNote.trim().length===0" @click="onSave">{{ $t('features.admin.feedback.notes.save','Save note') }}</UButton>
      </div>
    </template>
  </UModal>
  <div v-if="saveError" class="sr-only" aria-live="assertive">{{ saveError }}</div>
</template>

<script setup lang="ts">
const props = defineProps<{ open:boolean; detail:string | null | undefined; isEditor:boolean; username:string | null | undefined }>()
const emit = defineEmits<{(e:'update:open', v:boolean):void; (e:'save', nextDetail:string):void }>()

const newNote = ref('')
const saving = ref(false)
const saveError = ref<string | null>(null)

const noteFieldId = 'feedback-notes-modal-field'
const noteHelpId = 'feedback-notes-help'

const modalTitle = computed(() => $t('features.admin.feedback.notes.title','Internal notes'))
const modalDescription = computed(() => $t('features.admin.feedback.notes.description','Review existing notes and add a new internal note'))

const noteFieldRef = ref<HTMLElement | null>(null)
const triggerButton = ref<HTMLElement | null>(null)
const cancelButtonRef = ref<InstanceType<typeof UButton> | null>(null)

const notesList = computed(() => {
  const d = props.detail || ''
  const parts = d.split(/\n--- /).filter(p => p.trim().length > 0)
  return parts.slice().reverse().map((p, i) => (i === 0 && !p.startsWith('--- ')) ? p : '--- ' + p)
})

function ts() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

async function onSave() {
  if (!props.isEditor) return
  try {
    saving.value = true
    const header = `--- [${ts()}] ${props.username || 'user'}:`
    const block = `${header}\n${newNote.value.trim()}\n`
    const base = props.detail || ''
    const next = base ? `${base}\n${block}` : block
    emit('save', next)
    saveError.value = null
  } finally {
    saving.value = false
    newNote.value = ''
  }
}

watch(() => props.open, (value) => {
  if (value) {
    triggerButton.value = document.activeElement as HTMLElement | null
    nextTick(() => {
      const textarea = document.getElementById(noteFieldId) as HTMLTextAreaElement | null
      textarea?.focus()
    })
  } else {
    nextTick(() => {
      triggerButton.value?.focus?.()
      triggerButton.value = null
    })
  }
})

function handleOpenUpdate(value: boolean) {
  emit('update:open', value)
}
</script>
