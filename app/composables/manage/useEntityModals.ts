import { reactive, ref } from 'vue'
import type { AnyManageCrud } from '@/types/manage'
import { useFormState } from '~/composables/manage/useFormState'

export function useEntityModals(
  crud: AnyManageCrud,
  opts: {
    localeCode: () => string
    t?: (k: string) => string
    toast?: any
    imagePreview?: { value: string | null }
    translatable?: boolean
  }
) {
  const { localeCode, t, toast, imagePreview } = opts

  // Modal state for create/edit form
  const isModalOpen = ref(false)
  const isEditing = ref(false)
  const saving = ref(false)

  const form = useFormState<Record<string, any>>({ initialValue: () => ({}) })
  const modalFormState = form.values
  const manage = reactive<{ englishItem: Record<string, any> | null }>({ englishItem: null })

  function et(key: 'create' | 'edit') {
    return key === 'edit' ? (t?.('ui.actions.edit') || 'Edit') : (t?.('ui.actions.create') || 'Create')
  }

  async function preloadEnglishItem(id: number | string) {
    try {
      const $fetch = useApiFetch
      const res: any = await $fetch(`${crud.resourcePath}/${id}`, { method: 'GET', params: { lang: 'en' } })
      manage.englishItem = res?.data ?? null
    } catch {
      manage.englishItem = null
    }
  }

  function onEdit(entity: any) {
    if (!entity) return
    isEditing.value = true
    form.replace(entity as Record<string, any>, { markDirty: false, updateInitial: true })
    if (imagePreview) imagePreview.value = (entity.image || entity.thumbnail_url || null) as any
    const isTranslatable = opts?.translatable !== false
    if (isTranslatable && localeCode() !== 'en') {
      preloadEnglishItem(entity.id).catch(() => {})
      const resolved = String(entity?.language_code_resolved || entity?.language_code || '')
      if (resolved && resolved !== String(localeCode())) {
        if ('name' in modalFormState) (modalFormState as any).name = ''
        if ('short_text' in modalFormState) (modalFormState as any).short_text = ''
        if ('description' in modalFormState) (modalFormState as any).description = ''
        if ('effects' in modalFormState) {
          try {
            const eff = (modalFormState as any).effects || {}
            eff[String(localeCode())] = []
            ;(modalFormState as any).effects = eff
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
    form.reset({ to: {} as Record<string, any>, updateInitial: true })
    if (imagePreview) imagePreview.value = null
    manage.englishItem = null
    isModalOpen.value = true
  }

  async function handleSubmit() {
    try {
      saving.value = true
      const payload: Record<string, any> = form.toObject()
      if ('is_active' in payload) payload.is_active = !!payload.is_active
      if ('image' in payload) {
        const v = payload.image
        const s = typeof v === 'string' ? v : ''
        const looksUrl = s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/')
        if (!looksUrl) delete payload.image
      }
      for (const k in payload) {
        if (payload[k] === '' || payload[k] === null) delete payload[k]
      }
      if (isEditing.value && payload.id != null) {
        await crud.update?.(payload.id, payload as any)
      } else {
        await crud.create?.(payload as any)
      }
      await crud.fetchList?.()
      form.markClean({ updateInitial: true })
      isModalOpen.value = false
      toast?.add?.({ title: (t?.('common.saved') ?? 'Saved') as string, color: 'success' })
    } catch (e) {
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

// Nuxt composable import (kept here to avoid circulars in call sites)
import { useApiFetch } from '~/utils/fetcher'
