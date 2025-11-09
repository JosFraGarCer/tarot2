<!-- /app/components/manage/ManageEntity.vue -->
<template>
  <div class="flex flex-col gap-4">

    <div class="space-y-2">
      <UAlert
        v-if="crud?.listError?.value"
        :title="t('errors.list_failed')"
        :description="crud.listError?.value || ''"
        color="error"
        variant="soft"
      />
      <UAlert
        v-if="crud?.actionError?.value"
        :title="t('errors.action_failed')"
        :description="crud.actionError?.value || ''"
        color="error"
        variant="soft"
      />
    </div>

    <ManageEntityFilters
      :crud="crud"
      :config="filtersConfig ?? crud.filterConfig"
      :label="label"
      :no-tags="noTags"
      :card-type="cardType"
      :on-create="onCreateClickWrapper"
    />
    <div class="flex gap-2">
      <UButton
        size="xs"
        icon="i-heroicons-arrow-up-tray"
        color="neutral"
        variant="soft"
        :loading="exporting"
        :label="$t('common.export') || 'Export'"
        @click="exportAll"
      />
      <UButton
        size="xs"
        icon="i-heroicons-arrow-down-tray"
        color="neutral"
        variant="soft"
        :label="$t('import.button') || 'Import'"
        :loading="importing"
        @click="openImportModal"
      />
    </div>

    <div v-if="viewMode === 'tabla'">
      <EntityTableWrapper
        :crud="crud"
        :label="label"
        :columns="resolvedColumns"
        @edit="onEdit"
        @delete="onDelete"
        @export="exportSelected"
        @batch-update="onBatchUpdate"
        @create="onCreateClickWrapper"
        @reset-filters="resetFilters"
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
        @create="onCreateClickWrapper"
        @reset-filters="resetFilters"
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
        @create="onCreateClickWrapper"
        @reset-filters="resetFilters"
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

    <ImportJson
      :open="importModalOpen"
      :title="importModalTitle"
      :description="null"
      :loading="importing"
      :error="importError"
      :confirm-label="$t('common.import') || 'Import'"
      :cancel-label="$t('common.cancel') || 'Cancel'"
      @submit="handleImportSubmit"
      @cancel="closeImportModal"
      @update:open="value => (importModalOpen = value)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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
import { useManageFilters } from '~/composables/manage/useManageFilters'
import { useManageColumns } from '~/composables/manage/useManageColumns'
import { useManageActions } from '~/composables/manage/useManageActions'
import type { EntityFilterConfig } from '~/composables/manage/useEntity'
import ImportJson from '~/components/manage/modal/ImportJson.vue'
import { useEntityTransfer } from '~/composables/manage/useEntityTransfer'

type ManageViewMode = 'tabla' | 'tarjeta' | 'classic' | 'carta'

const props = withDefaults(defineProps<{
  label: string
  useCrud: () => any
  viewMode: ManageViewMode
  entity: string
  templateKey?: string
  filtersConfig?: EntityFilterConfig
  columns?: any[]
  cardType?: boolean
  noTags?: boolean
  pageSizeItems?: Array<{ label: string; value: number }>
  onCreate?: () => void
}>(), {
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

const resolvedFilterConfig = computed(() => props.filtersConfig ?? (crud?.filterConfig ?? {}))

const { initializeDefaults, resetFilters } = useManageFilters(crud as any, {
  config: resolvedFilterConfig.value,
  fetchOnReset: true,
})

initializeDefaults()
void crud.fetchList()

// Preview composable
const { previewOpen, previewData, setPreviewOpen, openPreviewFromEntity } = useEntityPreview()

const resolvedColumns = useManageColumns({ entity: props.entity, crud })

// Expose a refresh helper compatible with legacy template usage
async function refresh() {
  return await crud.fetchList?.()
}

const {
  importing,
  exporting,
  importError,
  exportEntities: runEntityExport,
  importEntities: runEntityImport,
} = useEntityTransfer({
  resourcePath: crud.resourcePath,
  entityLabel: props.label,
  filePrefix: props.entity,
  onImported: async () => {
    await crud.fetchList?.()
  }
})

const importModalOpen = ref(false)
const importModalTitle = computed(() => `${t('import.button') || 'Import'} ${props.label}`)

function openImportModal() {
  importModalOpen.value = true
}

function closeImportModal() {
  importModalOpen.value = false
}

async function handleImportSubmit(file: File) {
  const success = await runEntityImport(file)
  if (success) {
    closeImportModal()
  }
}

function exportAll() {
  void runEntityExport()
}

function exportSelected(ids: number[]) {
  void runEntityExport(ids?.length ? { ids } : undefined)
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


const { onBatchUpdate, onFeedback, onTags } = useManageActions(crud as any, {
  entityLabel: props.label,
  toast,
})

function onPreview(entity: any) {
  openPreviewFromEntity(entity, t)
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
    toast?.add?.({ title: t('errors.update_failed') || 'Update failed', description: crud.actionError?.value || crud.listError?.value || '', color: 'error' })
  }
}

// onDeleteTranslation handled by deletion composable

// Helper: preload english version for hints in modal
// preloadEnglishItem handled within useEntityModals
</script>