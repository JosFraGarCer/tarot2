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
      :on-create="onCreateClick"
    />

    <div v-if="viewMode === 'tabla'">
      <ManageEntityTable
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
      <ManageEntityCards
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
    <div v-else-if="viewMode === 'tarjeta2'">
      <ManageEntityCards2
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
      :delete-loading="saving"
      :translation-loading="deleteTranslationLoading"
      :translation-lang="pendingDeleteTranslationItem?.language_code || localeCode"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { useI18n, useToast } from '#imports'
import { useApiFetch } from '~/utils/fetcher'
import PaginationControls from '~/components/common/PaginationControls.vue'
import ManageEntityFilters from '~/components/manage/EntityFilters.vue'
import ManageEntityTable from '~/components/manage/EntityTable.vue'
import ManageEntityCards from '~/components/manage/view/EntityCardsView.vue'
import ManageEntityCards2 from '~/components/manage/view/EntityCardsView2.vue'
import ManageEntityCarta from '~/components/manage/view/EntityCarta.vue'
import DeleteDialogs from '~/components/manage/common/DeleteDialogs.vue'
import PreviewModal from '~/components/manage/modal/PreviewModal.vue'
import FormModal from '~/components/manage/modal/FormModal.vue'
import { useTranslationActions } from '~/composables/manage/useTranslationActions'
import type { TableColumn } from '@nuxt/ui'
import type { EntityRow } from '~/components/manage/view/EntityTable.vue'

type ManageViewMode = 'tabla' | 'tarjeta' | 'tarjeta2' | 'carta'

const props = withDefaults(defineProps<{
  label: string
  useCrud: () => any
  viewMode: ManageViewMode
  entity: string
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

type PreviewPayload = {
  title: string
  img?: string | null
  shortText?: string | null
  description?: string | null
}

const previewOpen = ref(false)
const previewData = ref<PreviewPayload | null>(null)

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

async function confirmDeleteEntity() {
  const id = deleteTarget.value?.id
  if (id == null) return
  try {
    saving.value = true
    await crud.remove?.(id)
    await refresh()
    deleteModalOpen.value = false
    toast?.add?.({ title: t('common.deleted') || 'Deleted', color: 'success' })
  } catch (e) {
    toast?.add?.({ title: t('errors.delete_failed') || 'Delete failed', description: crud.error?.value, color: 'error' })
  } finally {
    saving.value = false
  }
}

function cancelDeleteDialogs() {
  deleteModalOpen.value = false
  deleteTranslationModalOpen.value = false
}

// Locale code for dialogs
const { locale } = useI18n()
const localeCode = computed(() => (typeof locale === 'string' ? locale : locale.value) as string)

// Normalize entity label for forms/dialogs
const entityLabel = computed(() => props.label)

// Modal state for create/edit form
const isModalOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const isUploadingImage = ref(false)
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const modalImageFieldConfig = ref<Record<string, any> | undefined>(undefined)
const modalFormState = reactive<Record<string, any>>({})

// Placeholder for english item if available
const manage = reactive<{ englishItem: Record<string, any> | null }>({ englishItem: null })

function et(key: 'create' | 'edit') {
  return key === 'edit' ? (t('common.edit') || 'Edit') : (t('common.create') || 'Create')
}

function handleImageFile(file: File | null) {
  imageFile.value = file
}
function handleRemoveImage() {
  imageFile.value = null
  imagePreview.value = null
}

async function handleSubmit() {
  try {
    saving.value = true
    // Shallow clone and normalize values to avoid backend/schema 422s
    const payload: Record<string, any> = { ...modalFormState }
    // Normalize boolean flags
    if ('is_active' in payload) payload.is_active = !!payload.is_active
    // Drop image if not a valid absolute URL or absolute path (let backend keep existing)
    if ('image' in payload) {
      const v = payload.image
      const s = typeof v === 'string' ? v : ''
      const looksUrl = s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/')
      if (!looksUrl) delete payload.image
    }
    // Remove empty strings and nulls for optional fields
    for (const k in payload) {
      if (payload[k] === '' || payload[k] === null) delete payload[k]
    }

    if (isEditing.value && payload.id != null) {
      await crud.update?.(payload.id, payload as any)
    } else {
      await crud.create?.(payload as any)
    }
    await crud.fetchList?.()
    isModalOpen.value = false
    toast?.add?.({ title: t('common.saved') || 'Saved', color: 'success' })
  } catch (e) {
    toast?.add?.({ title: t('errors.update_failed') || 'Save failed', description: crud.error?.value, color: 'error' })
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  isModalOpen.value = false
}

// Delete dialogs state
const deleteModalOpen = ref(false)
const deleteTranslationModalOpen = ref(false)
const deleteTranslationLoading = ref(false)
const deleteTarget = ref<any>({ id: null })
const pendingDeleteTranslationItem = ref<any | null>(null)

async function confirmDeleteTranslation() {
  if (!pendingDeleteTranslationItem.value) return
  deleteTranslationLoading.value = true
  try {
    // Backend borra solo la traducción cuando lang !== 'en'
    await crud.remove?.(pendingDeleteTranslationItem.value.id)
    await crud.fetchList?.()
    deleteTranslationModalOpen.value = false
    toast?.add?.({ title: t('common.deleted') || 'Deleted', color: 'success' })
  } catch (e) {
    toast?.add?.({ title: t('errors.delete_failed') || 'Delete failed', description: crud.error?.value, color: 'error' })
  } finally {
    deleteTranslationLoading.value = false
  }
}

const defaultPageSizes = computed(() => ([
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 }
]))

const page = computed(() => crud.pagination?.page ?? crud.pagination?.value?.page ?? 1)
const pageSize = computed(() => crud.pagination?.pageSize ?? crud.pagination?.value?.pageSize ?? 20)
const totalItems = computed(() => crud.pagination?.totalItems ?? crud.pagination?.value?.totalItems ?? 0)

// ✅ totalPages correcto y reactivo
const totalPages = computed<number>(() => {
  const pag = crud.pagination?.value ?? crud.pagination
  const total = Number(pag?.totalItems ?? 0)
  const size = Number(pag?.pageSize ?? 1)
  return Math.max(1, Math.ceil(total / size))
})

function onPageChange(page: number) {
  if (!crud.pagination) return
  const pag = crud.pagination.value ?? crud.pagination
  pag.page = page
}

function onPageSizeChange(size: number) {
  if (!Number.isFinite(size) || size <= 0 || !crud.pagination) return
  const pag = crud.pagination.value ?? crud.pagination
  pag.pageSize = size
  pag.page = 1
}


function onEdit(entity: any) {
  if (!entity) return
  isEditing.value = true
  // Reset and prefill modal form state
  for (const k of Object.keys(modalFormState)) delete (modalFormState as any)[k]
  Object.assign(modalFormState, entity)
  // Keep current preview if entity has image/thumbnail
  imagePreview.value = (entity.image || entity.thumbnail_url || null) as any
  // Preload english fallback for hints when not editing English
  if (localeCode.value !== 'en') {
    preloadEnglishItem(entity.id).catch(() => { /* ignore hint preload errors */ })
    // Si estamos viendo fallback (no existe traducción en el idioma actual), limpiar campos traducibles
    const resolved = String(entity?.language_code_resolved || entity?.language_code || '')
    if (resolved && resolved !== String(localeCode.value)) {
      if ('name' in modalFormState) (modalFormState as any).name = ''
      if ('short_text' in modalFormState) (modalFormState as any).short_text = ''
      if ('description' in modalFormState) (modalFormState as any).description = ''
      if ('effects' in modalFormState) {
        try {
          const eff = (modalFormState as any).effects || {}
          eff[String(localeCode.value)] = []
          ;(modalFormState as any).effects = eff
        } catch { /* noop */ }
      }
    }
  } else {
    manage.englishItem = null
  }
  isModalOpen.value = true
}
async function onDelete(entity: any) {
  if (!entity) return
  const lc = String(localeCode.value || '')
  const resolved = String(entity?.language_code_resolved || entity?.language_code || '')
  const isEnglishPage = lc === 'en'
  const isFallback = resolved && resolved !== lc // viendo fallback inglés (u otro idioma)

  if (isEnglishPage || isFallback) {
    // Borrar entidad completa
    deleteTarget.value = { id: entity.id }
    deleteModalOpen.value = true
  } else {
    // Estamos en idioma local y la entidad tiene traducción en ese idioma → borrar solo traducción
    pendingDeleteTranslationItem.value = entity
    deleteTranslationModalOpen.value = true
  }
}
function onExport(ids: number[]) {
  console.log('export', props.label, ids)
}
function onBatchUpdate(ids: number[]) {
  console.log('batchUpdate', props.label, ids)
}
function onPreview(entity: any) {
  if (!entity) return
  previewData.value = {
    title: entity.name ?? entity.title ?? entity.code ?? t('common.untitled') ?? '—',
    img: entity.image ?? entity.thumbnail_url ?? null,
    shortText: entity.short_text ?? entity.summary ?? null,
    description: entity.description ?? null,
  }
  previewOpen.value = true
}

function setPreviewOpen(value: boolean) {
  previewOpen.value = value
  if (!value) {
    previewData.value = null
  }
}
function onFeedback(entity?: any) {
  console.log('feedback', props.label, entity)
}
function onTags(entity?: any) {
  // open TagPicker (stub)
  console.log('tags', props.label, entity)
}
function onCreateClick() {
  // Emit event for external listeners, but always open the modal locally
  emit('create')
  // Prepare empty form for creation
  isEditing.value = false
  for (const k of Object.keys(modalFormState)) delete (modalFormState as any)[k]
  imageFile.value = null
  imagePreview.value = null
  manage.englishItem = null
  isModalOpen.value = true
}

// Status change with optimistic update
async function onChangeStatus(entity: any, nextStatus: any) {
  if (!entity) return
  const prev = entity.status
  try {
    entity.status = nextStatus
    await crud.updateStatus?.(entity.id, nextStatus)
    toast?.add?.({ title: t('status.updated') || 'Status updated', color: 'success' })
  } catch (e) {
    entity.status = prev
    toast?.add?.({ title: t('errors.update_failed') || 'Update failed', description: crud.error?.value, color: 'error' })
  }
}

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

async function onDeleteTranslation(entity: any) {
  if (!entity) return
  pendingDeleteTranslationItem.value = entity
  deleteTranslationModalOpen.value = true
}

// Helper: preload english version for hints in modal
async function preloadEnglishItem(id: number | string) {
  try {
    const $fetch = useApiFetch
    const res: any = await $fetch(`${crud.resourcePath}/${id}`, { method: 'GET', params: { lang: 'en' } })
    manage.englishItem = res?.data ?? null
  } catch {
    manage.englishItem = null
  }
}
</script>