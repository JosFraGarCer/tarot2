<!-- /app/components/manage/ManageEntity.vue -->
<template>
  <div class="flex flex-col gap-4">

    <UAlert
      v-if="crud?.error?.value"
      :title="t('common.error')"
      :description="crud.error?.value || ''"
      color="error"
      variant="soft"
    />

    <ManageEntityFilters
      :crud="crud"
      :config="filtersConfig"
      :label="label"
      :no-tags="noTags"
      :card-type="cardType"
      :on-create="onCreateClickWrapper"
    />

    <div v-if="viewMode === 'tabla'">
      <EntityTableWrapper
        :crud="crud"
        :label="label"
        :columns="resolvedColumns"
        @edit="onEdit"
        @delete="onDelete"
        @export="onExport"
        @batch-update="onBatchUpdate"
      />
    </div>
    <div v-else-if="viewMode === 'tarjeta'">
      <EntityCards
        :crud="crud"
        :label="label"
        :entity=entity
        :no-tags="noTags"
        :card-type="cardType"
        @edit="onEdit"
        @delete="onDelete"
        @feedback="onFeedback"
        @tags="onTags"
        @preview="onPreview"
      />
    </div>
    <div v-else-if="viewMode === 'classic'">
      <EntityCardsClassic
        :crud="crud"
        :label="label"
        :entity=entity
        :no-tags="noTags"
        :card-type="cardType"
        @edit="onEdit"
        @delete="onDelete"
        @feedback="onFeedback"
        @tags="onTags"
        @preview="onPreview"
      />
    </div>
    <div v-else class="text-xs text-neutral-500">
      <ManageEntityCarta
        :crud="crud"
        :label="label"
        :entity=entity
        :no-tags="noTags"
        :card-type="cardType"
        :template-key="templateKey"
        @edit="onEdit"
        @delete="onDelete"
        @feedback="onFeedback"
        @tags="onTags"
        @preview="onPreview"
      />
    </div>

    <PaginationControls
      v-if="crud?.pagination"
      :page="page"
      :page-size="pageSize"
      :total-items="totalItems"
      :total-pages="totalPages"
      :page-size-items="pageSizeItems || defaultPageSizes"
      @update:page="onPageChange"
      @update:page-size="onPageSizeChange"
    />
<!-- MODALES -->
    <PreviewModal
      v-if="previewData"
      :open="previewOpen"
      :title="previewData.title"
      :img="previewData.img"
      :short-text="previewData.shortText"
      :description="previewData.description"
      :card-info="entityLabel"
      @update:open="setPreviewOpen"
    />

    <FormModal
      :open="isModalOpen"
      :title="isEditing ? et('edit') : et('create')"
      :submit-label="$t('common.save')"
      :cancel-label="$t('common.cancel')"
      :loading="saving || isUploadingImage"
      :form="modalFormState || {}" 
      :entity-label="entityLabel"
      :entity= entity
      :schema="crud.schema"
      :image-file="imageFile"
      :image-preview="imagePreview"
      :image-field-config="modalImageFieldConfig"
      :english-item="manage.englishItem"
      @update:open="value => (isModalOpen = value)"
      @update:image-file="handleImageFile"
      @update:image-preview="value => (imagePreview = value)"
      @remove-image="handleRemoveImage"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <DeleteDialogs
      :delete-open="deleteModalOpen"
      :translation-open="deleteTranslationModalOpen"
      :entity-label="entityLabel"
      :on-confirm-delete="confirmDeleteEntity"
      :on-confirm-translation-delete="confirmDeleteTranslation"
      :on-cancel="cancelDeleteDialogs"
      :delete-loading="savingDelete"
      :translation-loading="deleteTranslationLoading"
      :translation-lang="pendingDeleteTranslationItem?.language_code || localeCode"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n, useToast } from '#imports'
import PaginationControls from '~/components/common/PaginationControls.vue'
import ManageEntityFilters from '~/components/manage/EntityFilters.vue'
import EntityTableWrapper from '~/components/manage/EntityTableWrapper.vue'
import EntityCards from '~/components/manage/view/EntityCards.vue'
import EntityCardsClassic from '~/components/manage/view/EntityCardsClassic.vue'
import ManageEntityCarta from '~/components/manage/view/EntityCarta.vue'
import DeleteDialogs from '~/components/manage/common/DeleteDialogs.vue'
import PreviewModal from '~/components/manage/modal/PreviewModal.vue'
import FormModal from '~/components/manage/modal/FormModal.vue'
import { useTranslationActions } from '~/composables/manage/useTranslationActions'
import { useEntityPreview } from '~/composables/manage/useEntityPreview'
import { useEntityPagination } from '~/composables/manage/useEntityPagination'
import { useImageUpload } from '~/composables/manage/useImageUpload'
import { useEntityDeletion } from '~/composables/manage/useEntityDeletion'
import { useOptimisticStatus } from '~/composables/manage/useOptimisticStatus'
import { useEntityModals } from '~/composables/manage/useEntityModals'
import type { TableColumn } from '@nuxt/ui'
import type { EntityRow } from '~/components/manage/view/EntityTable.vue'

type ManageViewMode = 'tabla' | 'tarjeta' | 'classic' | 'carta'

const props = withDefaults(defineProps<{
  label: string
  useCrud: () => any
  viewMode: ManageViewMode
  entity: string
  templateKey?: string
  filtersConfig?: Record<string, boolean>
  columns?: any[]
  cardType?: boolean
  noTags?: boolean
  pageSizeItems?: Array<{ label: string; value: number }>
  onCreate?: () => void
}>(), {
  filtersConfig: () => ({}),
  columns: () => [],
  cardType: false,
  noTags: false,
  pageSizeItems: undefined,
  onCreate: undefined
})

const emit = defineEmits<{ (e: 'create'): void }>()

const { t } = useI18n()
const toast = useToast?.() as any

const crud = props.useCrud()

const multiFilterAliases = new Set(['tags'])

function initializeFilterDefaults() {
  const configEntries = Object.entries(props.filtersConfig || {})
  const aliasByApiKey = new Map<string, string>()

  for (const [alias, target] of configEntries) {
    if (typeof target === 'string' && target) {
      aliasByApiKey.set(target, alias)
    } else if (target === true) {
      aliasByApiKey.set(alias, alias)
    }
  }

  const filters = crud?.filters as Record<string, any> | undefined
  if (!filters) return

  for (const [key, current] of Object.entries(filters)) {
    if (current !== true) continue
    const alias = aliasByApiKey.get(key) ?? key
    if (multiFilterAliases.has(alias) || key.endsWith('_ids')) {
      filters[key] = []
    } else {
      filters[key] = undefined
    }
  }
}

initializeFilterDefaults()
void crud.fetchList()

// Preview composable
const { previewOpen, previewData, setPreviewOpen, openPreviewFromEntity } = useEntityPreview()

const resolvedColumns = computed<TableColumn<EntityRow>[]>(() => {
  const extras: TableColumn<EntityRow>[] = []

  const add = (column?: TableColumn<EntityRow>) => {
    if (!column) return
    extras.push(column)
  }

  add({ accessorKey: 'code', header: t('common.code') })
  add({ accessorKey: 'lang', header: t('common.language') })

  switch (props.entity) {
    case 'baseCard':
      add({ accessorKey: 'card_type', header: t('entities.cardType') })
      add({ accessorKey: 'tags', header: t('common.tags') })
      break
    case 'cardType':
      add({ accessorKey: 'category', header: t('common.category') })
      break
    case 'facet':
      add({ accessorKey: 'arcana', header: t('entities.arcana') })
      add({ accessorKey: 'tags', header: t('common.tags') })
      break
    case 'skill':
      add({ accessorKey: 'facet', header: t('entities.facet') })
      add({ accessorKey: 'tags', header: t('common.tags') })
      break
    case 'world':
    case 'arcana':
      add({ accessorKey: 'tags', header: t('common.tags') })
      break
    case 'tag':
      add({ accessorKey: 'parent', header: t('common.parent') })
      add({ accessorKey: 'category', header: t('common.category') })
      break
    default:
      break
  }

  add({ accessorKey: 'updated_at', header: t('common.updatedAt') })

  return extras
})

// Expose a refresh helper compatible with legacy template usage
async function refresh() {
  return await crud.fetchList?.()
}

// Deletion composable
const localeCode = computed(() => (typeof locale === 'string' ? locale : locale.value) as string)
const {
  deleteModalOpen,
  deleteTranslationModalOpen,
  deleteTranslationLoading,
  deleteTarget,
  pendingDeleteTranslationItem,
  saving: deletingSaving,
  cancelDeleteDialogs,
  confirmDeleteEntity,
  confirmDeleteTranslation,
  onDelete,
} = useEntityDeletion(crud as any, t, toast, () => localeCode.value)

// Locale
const { locale } = useI18n()

// Normalize entity label for forms/dialogs
const entityLabel = computed(() => props.label)

// Image upload composable
const { isUploadingImage, imageFile, imagePreview, modalImageFieldConfig, handleImageFile, handleRemoveImage } = useImageUpload()

// Form modals composable
const {
  isModalOpen,
  isEditing,
  saving,
  modalFormState,
  manage,
  et,
  onEdit,
  onCreateClick,
  handleSubmit,
  handleCancel,
} = useEntityModals(crud as any, { localeCode: () => localeCode.value, t, toast, imagePreview })

// map saving for delete dialogs
const savingDelete = computed(() => deletingSaving.value)

// Pagination composable
const { page, pageSize, totalItems, totalPages, defaultPageSizes, onPageChange, onPageSizeChange } = useEntityPagination(crud as any)


// Edit/Delete handlers from composables already assigned
function onExport(ids: number[]) {
  console.log('export', props.label, ids)
}
function onBatchUpdate(ids: number[]) {
  console.log('batchUpdate', props.label, ids)
}
function onPreview(entity: any) {
  openPreviewFromEntity(entity, t)
}

function onFeedback(entity?: any) {
  console.log('feedback', props.label, entity)
}
function onTags(entity?: any) {
  // open TagPicker (stub)
  console.log('tags', props.label, entity)
}
function onCreateClickWrapper() {
  onCreateClick((e: 'create') => emit(e))
}

// Optimistic status update
const { onChangeStatus } = useOptimisticStatus(crud as any, t, toast)

// Translation actions
async function onTranslate(entity: any, payload?: { name: string; short_text?: string|null; description?: string|null }) {
  const tr = useTranslationActions(crud.resourcePath)
  try {
    // If payload not provided, just no-op (UI modal not implemented here)
    if (!payload) return
    await tr.upsert(entity.id, payload)
    await crud.fetchList?.()
    toast?.add?.({ title: t('common.saved') || 'Saved', color: 'success' })
  } catch (e) {
    toast?.add?.({ title: t('errors.update_failed') || 'Update failed', description: crud.error?.value, color: 'error' })
  }
}

// onDeleteTranslation handled by deletion composable

// Helper: preload english version for hints in modal
// preloadEnglishItem handled within useEntityModals
</script>