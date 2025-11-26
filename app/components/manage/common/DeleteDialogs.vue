<!-- app/components/manage/common/DeleteDialogs.vue -->
<!-- app/components/manage/common/EntityDeleteDialogs.vue -->

<script setup lang="ts">
import ConfirmDialog from '~/components/manage/modal/ConfirmDialog.vue'
const props = defineProps<{
  deleteOpen: boolean
  translationOpen: boolean
  entityLabel: string
  onConfirmDelete: () => void
  onConfirmTranslationDelete: () => void
  onCancel: () => void
  deleteLoading?: boolean
  translationLoading?: boolean
  translationLang?: string | null
}>()
</script>

<template>
  <ConfirmDialog
    :open="props.deleteOpen"
    :title="$t('ui.dialogs.confirm.deleteTitle', { entity: props.entityLabel })"
    :description="$t('ui.dialogs.confirm.deleteDescription', { entity: props.entityLabel })"
    :confirm-label="$t('ui.dialogs.confirm.deleteConfirm')"
    :cancel-label="$t('ui.actions.cancel')"
    :loading="props.deleteLoading"
    @update:open="(v: boolean) => { if (!v) props.onCancel() }"
    @confirm="props.onConfirmDelete"
    @cancel="props.onCancel"
  />
  <ConfirmDialog
    :open="props.translationOpen"
    :title="$t('ui.dialogs.confirm.deleteTranslationTitle', { entity: props.entityLabel })"
    :description="$t('ui.dialogs.confirm.deleteTranslationDescription', { entity: props.entityLabel, lang: props.translationLang || 'en' })"
    :confirm-label="$t('ui.dialogs.confirm.deleteTranslationConfirm')"
    :cancel-label="$t('ui.actions.cancel')"
    :loading="props.translationLoading"
    @update:open="(v: boolean) => { if (!v) props.onCancel() }"
    @confirm="props.onConfirmTranslationDelete"
    @cancel="props.onCancel"
  />
</template>