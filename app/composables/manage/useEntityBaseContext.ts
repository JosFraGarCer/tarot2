import { computed, ref, reactive, provide, inject, type Ref, unref, toValue, onMounted, onUnmounted } from 'vue'
import { useI18n, useToast } from '#imports'
import { normalizeSlideoverKind, type SlideoverKind } from '~/utils/manage/kinds'
import {
  provideEntityCapabilities,
  provideEntityCapabilitiesDefaults,
  resolveEntityCapabilities,
  useEntityCapabilities,
  type EntityCapabilities,
} from '~/composables/common/useEntityCapabilities'
import { useTableSelection } from '@/composables/common/useTableSelection'
import { mapEntityToRow, type EntityRow } from '~/utils/manage/entityRows'
import { useManageFilters } from '~/composables/manage/useManageFilters'
import { useManageColumns } from '~/composables/manage/useManageColumns'
import { useManageActions } from '~/composables/manage/useManageActions'
import { useEntityPagination } from '~/composables/manage/useEntityPagination'
import { useImageUpload } from '~/composables/manage/useImageUpload'
import { useEntityDeletion } from '~/composables/manage/useEntityDeletion'
import { useEntityModals } from '~/composables/manage/useEntityModals'
import { useEntityTransfer } from '~/composables/manage/useEntityTransfer'
import { useEntityTags } from '~/composables/manage/useEntityTags'
import { useFeedback } from '~/composables/manage/useFeedback'
import { useEntityFormPreset } from '~/composables/manage/useEntityFormPreset'
import type { AnyManageCrud } from '~/types/manage'
import type { EntityFilterConfig } from '~/composables/manage/useEntity'

const ENTITY_BASE_CONTEXT_KEY = Symbol('EntityBaseContext')

export interface EntityBaseContextOptions {
  label: Ref<string>
  useCrud: Ref<() => AnyManageCrud>
  viewMode: Ref<string>
  entity: Ref<string>
  templateKey: Ref<string | undefined>
  filtersConfig: Ref<EntityFilterConfig | undefined>
  columns: Ref<unknown[] | undefined>
  cardType: Ref<boolean | undefined>
  noTags: Ref<boolean | undefined>
  translatable: Ref<boolean | undefined>
  pageSizeItems: Ref<Array<{ label: string; value: number }> | undefined>
  emit: (e: 'create') => void
}

/**
 * Composable: useEntityBaseContext
 * Purpose: Encapsulates all state and logic for EntityBase.vue orchestration
 */
export function useEntityBaseContext(options: EntityBaseContextOptions) {
  const { t, locale } = useI18n()
  const toast = useToast?.() || { add: console.log }
  const crud = unref(options.useCrud)()

  // --- Capabilities ---
  const crudResourceKind = computed(() => {
    const path = crud?.resourcePath
    if (typeof path !== 'string' || !path.length) return null
    return path.replace(/^\/+/, '').replace(/^api\//, '').split('/')[0] || null
  })

  const resolvedEntityKind = computed(() => crudResourceKind.value ?? toValue(options.entity) ?? null)
  const capabilityDefaults = computed(() => resolveEntityCapabilities(resolvedEntityKind.value ?? undefined))
  const capabilityOverrides = computed<Partial<EntityCapabilities>>(() => {
    const overrides: Partial<EntityCapabilities> = {}
    const translatable = toValue(options.translatable)
    if (translatable !== undefined) {
      overrides.translatable = translatable
      overrides.hasTranslations = translatable
    }
    if (toValue(options.noTags) === true) overrides.hasTags = false
    const cardType = toValue(options.cardType)
    if (cardType !== undefined) overrides.cardType = cardType as EntityCapabilities['cardType']
    return overrides
  })

  provideEntityCapabilitiesDefaults(capabilityDefaults)
  provideEntityCapabilities(capabilityOverrides)
  const capabilities = useEntityCapabilities({ kind: resolvedEntityKind })

  // --- Selection & Columns ---
  const tableSelectionSource = useTableSelection(() => crud.items.value.map((item: any) => (item as any)?.id ?? (item as any)?.uuid ?? (item as any)?.code))
  const resolvedColumns = useManageColumns({ entity: toValue(options.entity), crud })
  const displayedColumns = computed(() => {
    const cols = toValue(options.columns)
    return (Array.isArray(cols) && cols.length ? cols : resolvedColumns.value)
  })

  // --- Filters ---
  const resolvedFilterConfig = computed(() => toValue(options.filtersConfig) ?? (crud?.filterConfig ?? {}))
  const { initializeDefaults, resetFilters } = useManageFilters(crud, {
    config: resolvedFilterConfig.value,
    fetchOnReset: true,
  })
  initializeDefaults()
  void crud.fetchList?.()

  // --- Previews ---
  const previewOpen = ref(false)
  const previewEntityRow = ref<EntityRow | null>(null)
  const previewRawEntity = ref<Record<string, any> | null>(null)

  function openPreviewFromEntity(entity: Record<string, any>) {
    if (!entity) return
    const row = mapEntityToRow(entity, {
      resourcePath: crud.resourcePath || '',
      label: toValue(options.label),
      entity: toValue(options.entity),
    })
    previewEntityRow.value = row
    previewRawEntity.value = entity
    previewOpen.value = true
  }

  // --- Slideover ---
  const slideoverEntityId = ref<number | null>(null)
  const slideoverKind = ref<SlideoverKind | null>(null)
  const defaultSlideoverKind = computed<SlideoverKind>(() => normalizeSlideoverKind(crudResourceKind.value ?? toValue(options.entity)))
  const resolvedSlideoverKind = computed<SlideoverKind>(() => normalizeSlideoverKind(slideoverKind.value ?? defaultSlideoverKind.value))

  const slideoverOpen = computed({
    get: () => slideoverEntityId.value !== null,
    set: (value: boolean) => {
      if (!value) {
        slideoverEntityId.value = null
        slideoverKind.value = null
      }
    },
  })

  const slideoverNeighbors = computed(() => {
    const currentId = slideoverEntityId.value
    if (currentId === null) return { prev: null as number | null, next: null as number | null }
    const items = Array.isArray(crud?.items?.value) ? crud.items.value : []
    const ids = items.map((item: any) => Number(item?.id ?? item?.raw?.id)).filter((value: number) => Number.isFinite(value) && value > 0)
    if (!ids.length) return { prev: null as number | null, next: null as number | null }
    const index = ids.findIndex((value: number) => value === currentId)
    if (index === -1) return { prev: null as number | null, next: null as number | null }
    return {
      prev: index > 0 ? ids[index - 1] : null,
      next: index < ids.length - 1 ? ids[index + 1] : null
    }
  })

  function openFullEditor(payload: Record<string, any> | number) {
    const p = payload
    const raw = (typeof p === 'object' ? (p as any)?.raw ?? p : null) as Record<string, any> | null
    const id = typeof p === 'number' ? p : Number(raw?.id ?? raw?.entity_id ?? raw?.uuid)
    if (!Number.isFinite(id) || id <= 0) return
    slideoverEntityId.value = id
    const inferredKind = raw?.kind ?? raw?.entity_type ?? crudResourceKind.value ?? toValue(options.entity)
    slideoverKind.value = normalizeSlideoverKind(inferredKind as string | null ?? toValue(options.entity))
  }

  // --- Transfer (Import/Export) ---
  const {
    importing,
    exporting,
    importError,
    exportEntities: runEntityExport,
    importEntities: runEntityImport,
  } = useEntityTransfer({
    resourcePath: crud.resourcePath,
    entityLabel: toValue(options.label),
    filePrefix: toValue(options.entity),
    onImported: async () => { await crud.fetchList?.() }
  })

  const importModalOpen = ref(false)
  const importModalTitle = computed(() => `${t('importExport.import.actions.trigger') || 'Import'} ${toValue(options.label)}`)
  const openImportModal = () => { importModalOpen.value = true }
  const closeImportModal = () => { importModalOpen.value = false }
  const handleImportSubmit = async (file: File) => {
    if (await runEntityImport(file)) closeImportModal()
  }

  // --- Deletion ---
  const localeCode = computed(() => (typeof locale === 'string' ? locale : locale.value) as string)
  const {
    deleteModalOpen,
    deleteTranslationModalOpen,
    deleteTranslationLoading,
    pendingDeleteTranslationItem,
    saving: deletingSaving,
    cancelDeleteDialogs,
    confirmDeleteEntity,
    confirmDeleteTranslation,
    onDelete,
  } = useEntityDeletion(crud, t, toast, () => localeCode.value, { translatable: toValue(options.translatable) })

  // --- Image Upload ---
  const { isUploadingImage, imageFile, imagePreview, modalImageFieldConfig, handleImageFile, handleRemoveImage } = useImageUpload()

  // --- Forms ---
  const { fields: presetFields, defaults: presetDefaults, schema: presetSchema } = useEntityFormPreset(resolvedEntityKind)
  
  const {
    isModalOpen,
    isEditing,
    saving,
    et,
    modalFormState,
    manage,
    onEdit,
    onCreateClick,
    handleSubmit,
    handleCancel,
  } = useEntityModals(crud, { 
    localeCode: () => localeCode.value, 
    t, 
    toast, 
    imagePreview, 
    translatable: toValue(options.translatable),
    defaults: presetDefaults,
    schema: presetSchema
  })

  // --- Pagination ---
  const pagination = useEntityPagination(crud)

  // --- Actions & Feedback/Tags ---
  const { onBatchUpdate, onFeedback: notifyFeedback, onTags: notifyTags } = useManageActions(crud, {
    entityLabel: toValue(options.label),
    toast,
  })

  const tags = useEntityTags({ entityKey: toValue(options.entity), entityLabel: toValue(options.label), crud, toast })
  const tagsModalTitle = computed(() => `${t('ui.fields.tags') || 'Tags'} ${toValue(options.label)}`)
  async function onTagsClick(entity: unknown) {
    const record = (entity as Record<string, any>) || {}
    if (notifyTags) notifyTags(record)
    await tags.open({ entity: record })
  }

  const feedback = useFeedback({ entityKey: toValue(options.entity), entityLabel: toValue(options.label), crud, toast })
  async function onFeedbackClick(entity: unknown) {
    const record = (entity as Record<string, any>) || {}
    if (notifyFeedback) notifyFeedback(record)
    feedback.open({ entity: record })
  }

  // --- Session/Auth Warning ---
  const lastAuthCheck = ref(Date.now())
  const authInterval = 1000 * 60 * 5 // Check every 5 mins

  const checkAuthStatus = async () => {
    if (!import.meta.client) return
    try {
      // Intentamos un fetch ligero para ver si la sesión sigue viva
      await $fetch('/api/auth/session', { method: 'GET' })
      lastAuthCheck.value = Date.now()
      authFailCount.value = 0 // Reset on success
    } catch (e: any) {
      authFailCount.value++
      if (e.statusCode === 401 || e.statusCode === 403 || authFailCount.value >= 3) {
        toast.add({
          title: t('auth.sessionExpired.title'),
          description: t('auth.sessionExpired.description'),
          color: 'error',
          // @ts-ignore - Support persistent toast if library allows
          duration: 0,
        })
        // Force redirect to login if it's a hard fail
        if (e.statusCode === 401) {
          window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname)
        }
      }
    }
  }

  const authFailCount = ref(0)

  let authTimer: any = null
  const cleanupAuthTimer = () => {
    if (authTimer) {
      clearInterval(authTimer)
      authTimer = null
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      cleanupAuthTimer()
      authTimer = setInterval(checkAuthStatus, authInterval)
    }
  })
  onUnmounted(() => {
    cleanupAuthTimer()
  })

  // --- Event Handlers Wrapper ---
  const onCreateClickWrapper = () => onCreateClick(() => options.emit('create'))

  // --- Context Object (Flat) ---
  const context = {
    // Reactive Options
    label: computed(() => toValue(options.label)),
    entityKey: computed(() => toValue(options.entity)),
    viewMode: computed(() => toValue(options.viewMode)),
    templateKey: computed(() => toValue(options.templateKey)),
    filtersConfig: computed(() => toValue(options.filtersConfig)),
    columns: computed(() => toValue(options.columns)),
    cardType: computed(() => toValue(options.cardType)),
    noTags: computed(() => toValue(options.noTags)),
    translatable: computed(() => toValue(options.translatable)),
    pageSizeItems: computed(() => toValue(options.pageSizeItems)),

    // Core State
    crud,
    capabilities,
    tableSelectionSource,
    resolvedEntityKind,
    displayedColumns,
    localeCode,

    // Pagination
    pagination,
    onPageChange: pagination.onPageChange,
    onPageSizeChange: pagination.onPageSizeChange,

    // Previews
    previewOpen,
    previewEntityRow,
    previewRawEntity,
    onPreview: (entity: unknown) => {
      const record = (entity as Record<string, any>) || {}
      return openPreviewFromEntity(record)
    },
    setPreviewOpen: (v: boolean) => { previewOpen.value = v },

    // Slideover
    slideoverOpen,
    slideoverEntityId,
    resolvedSlideoverKind,
    slideoverNeighbors,
    openFullEditor,
    setSlideoverOpen: (v: boolean) => { 
      if (!v) {
        slideoverEntityId.value = null
        slideoverKind.value = null
      }
    },

    // Transfer
    exporting,
    importing,
    importError,
    importModalOpen,
    importModalTitle,
    runEntityExport,
    runEntityImport,
    openImportModal,
    closeImportModal,
    handleImportSubmit,
    setImportOpen: (v: boolean) => { importModalOpen.value = v },

    // Deletion
    deleteModalOpen,
    deleteTranslationModalOpen,
    deleteTranslationLoading,
    pendingDeleteTranslationItem,
    deletingSaving,
    cancelDeleteDialogs,
    confirmDeleteEntity,
    confirmDeleteTranslation,
    onDelete: (entity: unknown) => {
      const record = (entity as Record<string, any>) || {}
      return onDelete(record)
    },

    // Image Upload
    isUploadingImage,
    imageFile,
    imagePreview,
    modalImageFieldConfig,
    handleImageFile,
    handleRemoveImage,
    updateImagePreview: (v: string | null) => { imagePreview.value = v },

    // Forms
    isModalOpen,
    isEditing,
    saving,
    et,
    modalFormState,
    modalFields: presetFields, // Exposed from preset
    formSchema: presetSchema,  // Exposed from preset
    manage,
    onEdit: (entity: unknown) => {
      const record = (entity as Record<string, any>) || {}
      return onEdit(record)
    },
    onCreate: onCreateClickWrapper,
    handleSubmit: async (payload?: any) => {
      // 🧪 Robust Zod Validation Support (.refine, .transform)
      // Senior Critic: "Zod Failures" in Manual QA Checklist
      const schema = isEditing.value ? presetSchema.value?.update : presetSchema.value?.create
      
      // Manejar el caso donde el payload viene de un @submit de UForm (sin argumentos)
      // o de un emit('submit') manual.
      const data = payload?.data ?? (payload && !payload.preventDefault ? payload : modalFormState.value)
      
      if (!data) {
        console.error('[useEntityBaseContext] handleSubmit: no data found in payload or modalFormState', payload)
        return
      }

      if (schema) {
        const result = schema.safeParse(data)
        if (!result.success) {
          // Si el esquema falla aquí, es por un refine/transform que el front no pilló individualmente
          const firstError = result.error.issues[0]
          if (firstError) {
            toast.add({
              title: t('ui.errors.validation_failed', 'Validation Error'),
              description: firstError.message,
              color: 'error'
            })
          }
          return
        }
        // Usar los datos transformados por Zod si la validación fue exitosa
        // Si el payload tenía una propiedad .data, la actualizamos para que useEntityModals la use
        if (payload && payload.data) {
          payload.data = result.data
        } else {
          // Actualizamos el estado del formulario con los datos limpios de Zod
          Object.assign(modalFormState.value as object, result.data as object)
        }
      }
      await handleSubmit()
    },
    handleCancel,
    setModalOpen: (v: boolean) => { isModalOpen.value = v },

    // Actions & Utils
    resetFilters,
    exportAll: () => runEntityExport(),
    exportSelected: (ids: number[]) => runEntityExport(ids?.length ? { ids } : undefined),
    onFeedback: (entity: unknown) => {
      const record = (entity as Record<string, any>) || {}
      return onFeedbackClick(record)
    },
    onTags: (entity: unknown) => {
      const record = (entity as Record<string, any>) || {}
      return onTagsClick(record)
    },
    handleRowClick: (row: any) => {
      const record = (row?.raw ?? row) as Record<string, any>
      onEdit(record)
    },
    handleRowDblClick: (row: any) => {
      const record = (row?.raw ?? row) as Record<string, any>
      openFullEditor(record)
    },
    handleBulkUpdate: (selected: any) => {
      const ids = Array.isArray(selected) ? selected.map(Number).filter(Number.isFinite) : tableSelectionSource.selectedList.value
      if (ids.length) onBatchUpdate(ids as number[])
    },
    handleEntitySaved: () => crud.fetchList?.(),
    handleSlideoverNavigate: (id: number) => {
      const target = crud.items.value.find((item: any) => Number(item?.id ?? item?.raw?.id) === id)
      if (target) {
        openFullEditor(target as Record<string, any>)
      } else {
        openFullEditor({ id } as Record<string, any>)
      }
    },

    // Feedback specific
    feedbackModalOpen: feedback.modalOpen,
    feedbackSaving: feedback.saving,
    feedbackEntityId: feedback.entityId,
    feedbackEntityName: feedback.entityName,
    feedbackEntityType: feedback.entityType,
    handleFeedbackOpenChange: (v: boolean) => { if (!v) feedback.close() },
    handleFeedbackSubmit: (payload: any) => {
      // 🛡️ Robust safety check for feedback payload
      const data = payload?.data ?? payload
      if (!data || typeof data !== 'object') {
        console.error('[useEntityBaseContext] handleFeedbackSubmit: no data found in payload', payload)
        return
      }
      return feedback.submit(data)
    },

    // Tags specific
    tagsModalOpen: tags.modalOpen,
    tagsModalTitle,
    tagsSelection: tags.selection,
    tagsOptions: tags.tagOptions,
    tagsSaving: tags.saving,
    handleTagsModalOpenChange: (v: boolean) => { if (!v) tags.close() },
    setTagsSelection: tags.setSelection,
    confirmTags: tags.confirm,
  }

  provide(ENTITY_BASE_CONTEXT_KEY, context)
  return context
}

export function useEntityBase() {
  const context = inject<any>(ENTITY_BASE_CONTEXT_KEY)
  if (!context) throw new Error('useEntityBase must be used within EntityBase component')
  return context
}
