import { reactive, ref } from 'vue'
import type { useToast } from '#imports'
import type { AnyManageCrud } from '@/types/manage'
import { useFormState } from '~/composables/manage/useFormState'
import { useApiFetch } from '~/utils/fetcher'

export function useEntityModals(
  crud: AnyManageCrud,
  opts: {
    localeCode: () => string
    t?: (k: string) => string
    toast?: ReturnType<typeof useToast>
    imagePreview?: { value: string | null }
    translatable?: boolean
  }
) {
  const { localeCode, t, toast, imagePreview } = opts

  // Modal state for create/edit form
  const isModalOpen = ref(false)
  const isEditing = ref(false)
  const saving = ref(false)

  const form = useFormState<Record<string, unknown>>({ initialValue: () => ({}) })
  const modalFormState = form.values
  const manage = reactive<{ englishItem: Record<string, unknown> | null }>({ englishItem: null })

  function et(key: 'create' | 'edit') {
    return key === 'edit' ? (t?.('ui.actions.edit') || 'Edit') : (t?.('ui.actions.create') || 'Create')
  }

  async function preloadEnglishItem(id: number | string) {
    try {
      const res = await useApiFetch<Record<string, unknown>>(`${crud.resourcePath}/${id}`, { method: 'GET', params: { lang: 'en' } })
      manage.englishItem = res?.data ?? null
    } catch {
      manage.englishItem = null
    }
  }

  function onEdit(entity: Record<string, unknown>) {
    if (!entity) return
    isEditing.value = true
    form.replace(entity, { markDirty: false, updateInitial: true })
    if (imagePreview) imagePreview.value = (entity.image || entity.thumbnail_url || null) as string | null
    const isTranslatable = opts?.translatable !== false
    if (isTranslatable && localeCode() !== 'en') {
      preloadEnglishItem(entity.id as string | number).catch(() => {})
      const resolved = String(entity.language_code_resolved || entity.language_code || '')
      if (resolved && resolved !== String(localeCode())) {
        if ('name' in modalFormState) modalFormState.name = ''
        if ('short_text' in modalFormState) modalFormState.short_text = ''
        if ('description' in modalFormState) modalFormState.description = ''
        if ('effects' in modalFormState) {
          try {
            const eff = (modalFormState.effects as Record<string, unknown>) || {}
            eff[String(localeCode())] = []
            modalFormState.effects = eff
          } catch {}
        }
      }
    } else {
      manage.englishItem = null
    }
    isModalOpen.value = true
  }

  function onCreateClick(emit?: (e: 'create') => void) {
    emit?.('create')
    isEditing.value = false
    form.reset({ to: {}, updateInitial: true })
    if (imagePreview) imagePreview.value = null
    manage.englishItem = null
    isModalOpen.value = true
  }

  async function handleSubmit() {
    try {
      saving.value = true
      const payload: Record<string, unknown> = form.toObject()
      if ('is_active' in payload) payload.is_active = !!payload.is_active
      if ('image' in payload) {
        const v = payload.image
        const s = typeof v === 'string' ? v : ''
        const looksUrl = s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/')
        if (!looksUrl) delete payload.image
      }
      for (const k in payload) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- Remove empty values
        if (payload[k] === '' || payload[k] === null) delete payload[k]
      }
      if (isEditing.value && payload.id != null) {
        await crud.update?.(payload.id as string | number, payload)
      } else {
        await crud.create?.(payload)
      }
      await crud.fetchList?.()
      form.markClean({ updateInitial: true })
      isModalOpen.value = false
      toast?.add?.({ title: (t?.('common.saved') ?? 'Saved') as string, color: 'success' })
    } catch {
      toast?.add?.({
        title: (t?.('errors.update_failed') ?? 'Save failed') as string,
        description: crud.actionError?.value || crud.listError?.value || '',
        color: 'error',
      })
    } finally {
      saving.value = false
    }
  }

  function handleCancel() {
    form.reset()
    isModalOpen.value = false
  }

  return {
    // state
    isModalOpen,
    isEditing,
    saving,
    modalFormState,
    manage,
    isFormDirty: form.isDirty,
    // i18n helpers
    et,
    // actions
    onEdit,
    onCreateClick,
    handleSubmit,
    handleCancel,
    preloadEnglishItem,
    resetForm: form.reset,
    formControls: form,
  }
}
