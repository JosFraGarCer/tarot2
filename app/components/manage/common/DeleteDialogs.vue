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
    :title="$t('manageConfirm.deleteTitle', { entity: props.entityLabel })"
    :description="$t('manageConfirm.deleteDescription', { entity: props.entityLabel })"
    :confirm-label="$t('manageConfirm.deleteConfirm')"
    :cancel-label="$t('common.cancel')"
    :loading="props.deleteLoading"
    @update:open="(v: boolean) => { if (!v) props.onCancel() }"
    @confirm="props.onConfirmDelete"
    @cancel="props.onCancel"
  />
  <ConfirmDialog
    :open="props.translationOpen"
    :title="$t('manageConfirm.deleteTranslationTitle', { entity: props.entityLabel })"
    :description="$t('manageConfirm.deleteTranslationDescription', { entity: props.entityLabel, lang: props.translationLang || 'en' })"
    :confirm-label="$t('manageConfirm.deleteTranslationConfirm')"
    :cancel-label="$t('common.cancel')"
    :loading="props.translationLoading"
    @update:open="(v: boolean) => { if (!v) props.onCancel() }"
    @confirm="props.onConfirmTranslationDelete"
    @cancel="props.onCancel"
  />
</template>