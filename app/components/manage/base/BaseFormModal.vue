<!-- 
  Component: BaseFormModal
  Purpose: Orchestrates FormModal using EntityBaseContext
-->
<template>
  <FormModal
    :open="ctx.isModalOpen.value"
    :title="ctx.isEditing.value ? ctx.et('edit') : ctx.et('create')"
    :submit-label="$t('ui.actions.save')"
    :cancel-label="$t('ui.actions.cancel')"
    :loading="ctx.saving.value || ctx.isUploadingImage.value"
    :form="ctx.modalFormState || {}" 
    :entity-label="ctx.label.value"
    :entity="ctx.entityKey.value"
    :schema="ctx.crud.schema"
    :image-file="ctx.imageFile.value"
    :image-preview="ctx.imagePreview.value"
    :image-field-config="ctx.modalImageFieldConfig"
    :english-item="ctx.manage.englishItem"
    @update:open="ctx.setModalOpen"
    @update:image-file="ctx.handleImageFile"
    @update:image-preview="ctx.updateImagePreview"
    @remove-image="ctx.handleRemoveImage"
    @submit="ctx.handleSubmit"
    @cancel="ctx.handleCancel"
  />
</template>

<script setup lang="ts">
import { useEntityBase } from '~/composables/manage/useEntityBaseContext'
import FormModal from '~/components/manage/modal/FormModal.vue'

const ctx = useEntityBase()
</script>
