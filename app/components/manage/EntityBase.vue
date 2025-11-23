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
        size="sm"
        icon="i-heroicons-arrow-up-tray"
        color="neutral"
        variant="soft"
        :loading="exporting"
        :label="$t('ui.actions.export') || 'Export'"
        @click="exportAll"
      />
      <UButton
        size="sm"
        icon="i-heroicons-arrow-down-tray"
        color="neutral"
        variant="soft"
        :label="$t('importExport.import.actions.trigger') || 'Import'"
        :loading="importing"
        @click="openImportModal"
      />
    </div>

    <ClientOnly>
      <template #fallback>
        <div class="h-48 w-full"></div>
      </template>
      <div v-if="viewMode === 'tabla'">
        <EntityTableWrapper
          :key="(crud?.resourcePath || 'entity') + ':tabla'"
          :crud="crud"
          :label="label"
          :columns="displayedColumns"
          :no-tags="noTags"
          :entity="entity"
          @edit="onEdit"
          @full-edit="openFullEditor"
          @delete="onDelete"
          @feedback="onFeedback"
          @tags="onTags"
          @export="exportSelected"
          @batch-update="onBatchUpdate"
          @create="onCreateClickWrapper"
          @reset-filters="resetFilters"
        />
      </div>
      <div v-else-if="viewMode === 'tarjeta'">
        <EntityCards
          :key="(crud?.resourcePath || 'entity') + ':tarjeta'"
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
          :key="(crud?.resourcePath || 'entity') + ':classic'"
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
          :key="(crud?.resourcePath || 'entity') + ':carta'"
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
    </ClientOnly>

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
      :legacy-effects="previewData.legacyEffects"
      :effects-markdown="previewData.effectsMarkdown"
      @update:open="setPreviewOpen"
    />

    <FormModal
      :open="isModalOpen"
      :title="isEditing ? et('edit') : et('create')"
      :submit-label="$t('ui.actions.save')"
      :cancel-label="$t('ui.actions.cancel')"
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
      :confirm-label="$t('ui.actions.import') || 'Import'"
      :cancel-label="$t('ui.actions.cancel') || 'Cancel'"
      @submit="handleImportSubmit"
      @cancel="closeImportModal"
      @update:open="value => (importModalOpen = value)"
    />

    <EntityTagsModal
      :open="tagsModalOpen"
      :title="tagsModalTitle"
      :description="null"
      :model-value="tagsSelection"
      :options="tagsOptions"
      :saving="tagsSaving"
      :confirm-label="$t('ui.actions.save') || 'Save'"
      :cancel-label="$t('ui.actions.cancel') || 'Cancel'"
      @update:open="handleTagsModalOpenChange"
      @update:model-value="setTagsSelection"
      @confirm="confirmTags"
    />

    <FeedbackModal
      :open="feedbackModalOpen"
      :entity-id="feedbackEntityId"
      :entity-type="feedbackEntityType"
      :entity-name="feedbackEntityName"
      :entity-label="label"
      :saving="feedbackSaving"
      @update:open="handleFeedbackOpenChange"
      @submit="handleFeedbackSubmit"
    />

    <EntitySlideover
      v-if="slideoverOpen"
      v-model:open="slideoverOpen"
      :id="slideoverEntityId"
      :kind="resolvedSlideoverKind"
      :neighbors="slideoverNeighbors"
      @close="slideoverOpen = false"
      @saved="handleEntitySaved"
      @navigate="handleSlideoverNavigate"
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
import EntityTagsModal from '~/components/manage/modal/EntityTagsModal.vue'
import { useEntityTags } from '~/composables/manage/useEntityTags'
import FeedbackModal from '~/components/manage/modal/FeedbackModal.vue'
import { useFeedback } from '~/composables/manage/useFeedback'
import EntitySlideover from '~/components/manage/EntitySlideover.vue'

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
  translatable?: boolean
}>(), {
  columns: () => [],
  cardType: false,
  noTags: false,
  pageSizeItems: undefined,
  onCreate: undefined,
  translatable: true
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

const allowedSlideoverKinds = ['arcana', 'card_type', 'base_card', 'skill', 'world', 'world_card'] as const
type SlideoverKind = typeof allowedSlideoverKinds[number]

function normalizeSlideoverKind(kind: string | null | undefined): SlideoverKind {
  const candidate = toSlideoverKind(kind)
  return (allowedSlideoverKinds as readonly string[]).includes((candidate ?? '') as SlideoverKind)
    ? (candidate as SlideoverKind)
    : 'arcana'
}

function toSlideoverKind(kind: string | null | undefined): string | null {
  if (!kind) return null
  const normalized = kind
    .toString()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[-]+/g, '_')
    .toLowerCase()

  switch (normalized) {
    case 'cardtype':
    case 'card_type':
    case 'card-type':
      return 'card_type'
    case 'basecard':
    case 'base_card':
    case 'base-card':
      return 'base_card'
    case 'worldcard':
    case 'world_card':
    case 'world-card':
      return 'world_card'
    default:
      return normalized
  }
}

const slideoverEntityId = ref<number | null>(null)
const slideoverKind = ref<SlideoverKind | null>(null)
const crudResourceKind = computed(() => {
  const path = crud?.resourcePath
  if (typeof path !== 'string' || !path.length) return null
  return path.replace(/^\/+/, '').replace(/^api\//, '').split('/')[0] || null
})

const defaultSlideoverKind = computed<SlideoverKind>(() => normalizeSlideoverKind(crudResourceKind.value ?? props.entity))

const slideoverOpen = computed({
  get: () => slideoverEntityId.value !== null,
  set: (value: boolean) => {
    if (!value) {
      slideoverEntityId.value = null
      slideoverKind.value = null
    }
  },
})

const resolvedSlideoverKind = computed<SlideoverKind>(() => normalizeSlideoverKind(slideoverKind.value ?? defaultSlideoverKind.value))

const slideoverNeighbors = computed(() => {
  const currentId = slideoverEntityId.value
  if (currentId === null) return { prev: null as number | null, next: null as number | null }

  const items = Array.isArray(crud?.items?.value) ? crud.items.value : []
  const ids = items
    .map((item: any) => Number(item?.id ?? item?.raw?.id))
    .filter((value) => Number.isFinite(value) && value > 0)

  if (!ids.length) return { prev: null as number | null, next: null as number | null }

  const index = ids.findIndex((value) => value === currentId)
  if (index === -1) return { prev: null as number | null, next: null as number | null }

  const prev = index > 0 ? ids[index - 1] : null
  const next = index < ids.length - 1 ? ids[index + 1] : null
  return { prev, next }
})

const resolvedColumns = useManageColumns({ entity: props.entity, crud })
const displayedColumns = computed(() => (Array.isArray(props.columns) && props.columns.length ? props.columns : resolvedColumns.value))

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
const importModalTitle = computed(() => `${t('importExport.import.actions.trigger') || 'Import'} ${props.label}`)

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
} = useEntityDeletion(crud as any, t, toast, () => localeCode.value, { translatable: props.translatable })

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
} = useEntityModals(crud as any, { localeCode: () => localeCode.value, t, toast, imagePreview, translatable: props.translatable })

// map saving for delete dialogs
const savingDelete = computed(() => deletingSaving.value)

// Pagination composable
const { page, pageSize, totalItems, totalPages, defaultPageSizes, onPageChange, onPageSizeChange } = useEntityPagination(crud as any)


const { onBatchUpdate, onFeedback: notifyFeedback, onTags: notifyTags } = useManageActions(crud as any, {
  entityLabel: props.label,
  toast,
})

const {
  modalOpen: tagsModalOpen,
  selection: tagsSelection,
  tagOptions: tagsOptions,
  saving: tagsSaving,
  open: openTagsModal,
  close: closeTagsModal,
  setSelection: setTagsSelection,
  confirm: confirmTags,
} = useEntityTags({
  entityKey: props.entity,
  entityLabel: props.label,
  crud: crud as any,
  toast,
})

const tagsModalTitle = computed(() => `${t('ui.fields.tags') || 'Tags'} ${props.label}`)

async function onTags(entity: any) {
  notifyTags?.(entity)
  await openTagsModal({ entity })
}

function handleTagsModalOpenChange(value: boolean) {
  if (!value) {
    closeTagsModal()
  }
}

const {
  modalOpen: feedbackModalOpen,
  saving: feedbackSaving,
  entityId: feedbackEntityId,
  entityName: feedbackEntityName,
  entityType: feedbackEntityType,
  open: openFeedbackModal,
  close: closeFeedbackModal,
  submit: submitFeedback,
} = useFeedback({
  entityKey: props.entity,
  entityLabel: props.label,
  crud: crud as any,
  toast,
})

function handleFeedbackOpenChange(value: boolean) {
  if (!value) {
    closeFeedbackModal()
  }
}

async function handleFeedbackSubmit(payload: { entityId?: number | string; entityType?: string; data: any }) {
  await submitFeedback(payload.data)
}

async function onFeedback(entity: any) {
  notifyFeedback?.(entity)
  openFeedbackModal({ entity })
}

function onPreview(entity: any) {
  openPreviewFromEntity(entity, { t, locale: localeCode.value })
}
function onCreateClickWrapper() {
  onCreateClick((e: 'create') => emit(e))
}

function openFullEditor(payload: any) {
  const raw = typeof payload === 'object' ? payload?.raw ?? payload : null
  const id = typeof payload === 'number'
    ? payload
    : Number(raw?.id ?? raw?.entity_id ?? raw?.uuid)

  if (!Number.isFinite(id) || id <= 0) {
    return
  }

  slideoverEntityId.value = id
  const inferredKind = raw?.kind ?? raw?.entity_type ?? crudResourceKind.value ?? props.entity
  slideoverKind.value = normalizeSlideoverKind(inferredKind ?? props.entity)
}

async function handleEntitySaved() {
  await crud.fetchList?.()
}

function handleSlideoverNavigate(id: number) {
  if (!Number.isFinite(id) || id <= 0) return
  const target = Array.isArray(crud?.items?.value)
    ? crud.items.value.find((item: any) => Number(item?.id ?? item?.raw?.id) === Number(id))
    : null
  if (target) {
    openFullEditor(target)
  } else {
    openFullEditor(id)
  }
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
</script>