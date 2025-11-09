<!-- app/components/manage/Modal/FeedbackModal.vue -->
<!-- /app/components/manage/Modal/FeedbackModal.vue -->
<template>
  <UModal
    :open="open"
    :title="tt('features.feedback.title', 'Feedback')"
    @update:open="handleOpenChange"
  >
    <template #body>
      <div class="space-y-3">
        <div v-if="entityLabel" class="text-sm text-neutral-600 dark:text-neutral-300">
          <span class="font-medium">{{ entityLabel }}</span>
          <span v-if="entityName"> · {{ entityName }}</span>
        </div>

        <!-- Tipo de feedback -->
        <UFormField :label="tt('features.feedback.type', 'Type')">
          <USelectMenu
            v-model="local.type"
            :items="typeOptions"
            value-key="value"
            option-attribute="label"
            class="w-full"
          />
        </UFormField>

        <!-- Comentario -->
        <UFormField :label="tt('features.feedback.comment', 'Comment')">
          <UTextarea
            ref="commentRef"
            v-model="local.comment"
            class="w-full"
            :rows="5"
            :placeholder="tt('features.feedback.commentPlaceholder', 'Describe your feedback...')"
          />
        </UFormField>

        <!-- Adjuntos opcionales -->
        <UFormField :label="tt('features.feedback.attach', 'Attachment (optional)')">
          <UInput
            v-model="local.attachment"
            class="w-full"
            :placeholder="tt('features.feedback.attachmentPlaceholder', 'Link or reference')"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="soft"
          :label="tt('ui.actions.cancel', 'Cancel')"
          @click="close"
        />
        <UButton
          color="primary"
          :label="tt('ui.actions.save', 'Save')"
          :disabled="!local.comment.trim() || saving"
          :loading="saving"
          @click="submit"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { t, te } = useI18n()
function tt(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}

// ------------------------------------------------
// Tipado actualizado: incluye "translation"
// ------------------------------------------------
interface FeedbackPayload {
  type: 'bug' | 'suggestion' | 'balance' | 'translation'
  comment: string
  attachment?: string | null
}

const props = defineProps<{
  open: boolean
  entityId?: number | string
  entityType?: string
  entityName?: string
  entityLabel?: string
  saving?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'submit', payload: { entityId?: number | string; entityType?: string; data: FeedbackPayload }): void
}>()

// ------------------------------------------------
// Tipos disponibles
// ------------------------------------------------
const typeOptions = [
  { label: tt('features.feedback.bug', 'Bug'), value: 'bug' },
  { label: tt('features.feedback.suggestion', 'Suggestion'), value: 'suggestion' },
  { label: tt('features.feedback.balance', 'Balance'), value: 'balance' },
  { label: tt('feedback.translation', 'Translation'), value: 'translation' },
  { label: tt('feedback.other', 'Other'), value: 'other' }
]

// ------------------------------------------------
// Estado local del formulario
// ------------------------------------------------
const local = reactive<FeedbackPayload>({
  type: 'suggestion',
  comment: '',
  attachment: ''
})

const commentRef = ref<any>(null)

function close() {
  emit('update:open', false)
}

function reset() {
  local.type = 'suggestion'
  local.comment = ''
  local.attachment = ''
}

watch(
  () => props.open,
  (v) => {
    if (v) {
      reset()
      nextTick(() => {
        const el = (commentRef?.value?.$el as HTMLElement | undefined)
          ?.querySelector?.('textarea') as HTMLTextAreaElement | undefined
        if (el) el.focus()
        else if (typeof commentRef?.value?.focus === 'function') commentRef.value.focus()
      })
    }
  }
)

watch(
  () => [props.entityId, props.entityType, props.entityName],
  () => {
    if (props.open) reset()
  }
)

async function submit() {
  if (!local.comment.trim() || props.saving) return
  const data: FeedbackPayload = {
    type: local.type,
    comment: local.comment.trim(),
    attachment: local.attachment?.trim() || undefined
  }
  emit('submit', {
    entityId: props.entityId,
    entityType: props.entityType,
    data
  })
}

const saving = computed(() => !!props.saving)

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}
</script>
