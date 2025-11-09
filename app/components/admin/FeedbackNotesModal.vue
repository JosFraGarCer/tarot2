<!-- app/components/admin/FeedbackNotesModal.vue -->
<template>
  <UModal :open="open" :title="$t('admin.feedback.notes.title','Internal notes')" @update:open="v => emit('update:open', v)">
    <template #body>
      <div class="space-y-3">
        <div v-if="notesList.length === 0" class="text-sm text-gray-500">{{ $t('admin.feedback.notes.empty','No internal notes yet') }}</div>
        <div v-else class="max-h-64 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-800 rounded border border-gray-200 dark:border-gray-800">
          <div v-for="(n, idx) in notesList" :key="idx" class="p-2 text-sm">
            <pre class="whitespace-pre-wrap font-sans text-xs leading-5">{{ n }}</pre>
          </div>
        </div>
        <div v-if="isEditor" class="space-y-2">
          <UTextarea v-model="newNote" :rows="5" :placeholder="$t('admin.feedback.notes.addNote','Add note')" />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="soft" @click="emit('update:open', false)">{{ $t('common.cancel','Cancel') }}</UButton>
        <UButton v-if="isEditor" color="primary" :disabled="saving || newNote.trim().length===0" @click="onSave">{{ $t('admin.feedback.notes.save','Save note') }}</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{ open:boolean; detail:string | null | undefined; isEditor:boolean; username:string | null | undefined }>()
const emit = defineEmits<{(e:'update:open', v:boolean):void; (e:'save', nextDetail:string):void }>()

const newNote = ref('')
const saving = ref(false)

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
  } finally {
    saving.value = false
    newNote.value = ''
  }
}
</script>
