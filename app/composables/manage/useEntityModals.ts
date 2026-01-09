import { reactive, ref, type Ref, toValue } from 'vue'
import type { useToast } from '#imports'
import type { AnyManageCrud } from '@/types/manage'
import { useFormState } from '~/composables/manage/useFormState'
import { useFormPersistence } from '~/composables/manage/useFormPersistence'
import { useApiFetch } from '~/utils/fetcher'

export function useEntityModals(
  crud: AnyManageCrud,
  opts: {
    localeCode: () => string
    t?: (k: string) => string
    toast?: ReturnType<typeof useToast>
    imagePreview?: { value: string | null }
    translatable?: boolean
    defaults?: Ref<Record<string, unknown>>
    schema?: Ref<any>
  },
) {
  const { localeCode, t, toast, imagePreview } = opts

  // Modal state for create/edit form
  const isModalOpen = ref(false)
  const isEditing = ref(false)
  const saving = ref(false)

  const form = useFormState<Record<string, unknown>>({
    initialValue: () => {
      try {
        return opts.defaults?.value ? structuredClone(toValue(opts.defaults)) : {}
      }
      catch (_err) {
        return {}
      }
    },
  })
  const modalFormState = form.values

  const persistence = useFormPersistence(
    crud.resourcePath.replace(/\//g, '_'),
    form,
  )
  const manage = reactive<{ englishItem: Record<string, unknown> | null }>({ englishItem: null })

  function et(key: 'create' | 'edit') {
    return key === 'edit' ? (t?.('ui.actions.edit') || 'Edit') : (t?.('ui.actions.create') || 'Create')
  }

  async function preloadEnglishItem(id: number | string) {
    try {
      const res = await useApiFetch<{ data?: Record<string, unknown> }>(`${crud.resourcePath}/${id}`, { method: 'GET', params: { lang: 'en' } })
      manage.englishItem = res?.data ?? null
    }
    catch {
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
      preloadEnglishItem(entity.id as string | number).catch(() => { })
      const resolved = String(entity.language_code_resolved || entity.language_code || '')
      if (resolved && resolved !== String(localeCode())) {
        if ('name' in modalFormState) modalFormState.name = ''
        if ('short_text' in modalFormState) modalFormState.short_text = ''
        if ('description' in modalFormState) modalFormState.description = ''
        if ('effects' in modalFormState) {
          try {
            const eff = (modalFormState.effects as Record<string, unknown>) || {}
            eff[String(localeCode())] = []
            modalFormState.effects = { ...eff } // Refuerzo reactividad
          }
          catch { }
        }
      }
    }
    else {
      manage.englishItem = null
    }
    isModalOpen.value = true
  }

  function onCreateClick(emit?: (e: 'create') => void) {
    emit?.('create')
    isEditing.value = false
    const defaults = opts.defaults?.value ? structuredClone(toValue(opts.defaults)) : {}
    form.reset({ to: defaults, updateInitial: true })
    if (imagePreview) imagePreview.value = null
    manage.englishItem = null

    // Check for draft
    if (persistence.hasDraft()) {
      if (confirm(t?.('ui.drafts.recover_prompt') || 'Se ha encontrado un borrador. ¿Deseas recuperarlo?')) {
        persistence.loadDraft()
      }
      else {
        persistence.clearDraft()
      }
    }

    isModalOpen.value = true
  }

  async function handleSubmit() {
    try {
      saving.value = true

      // 🛡️ EXTRACCIÓN MANUAL ULTRA-SEGURA
      // Obtenemos un snapshot no reactivo del estado actual
      const rawValues = toValue(modalFormState)
      console.log('[DEBUG-MODALS] rawValues.arcana_id:', rawValues?.arcana_id, typeof rawValues?.arcana_id)
      if (!rawValues || typeof rawValues !== 'object') {
        throw new Error('Form data is empty or invalid')
      }

      const payload: Record<string, unknown> = {}

      // Copiamos solo las propiedades propias para evitar problemas con la cadena de prototipos o Proxies internos
      const keys = Object.keys(rawValues)
      for (const k of keys) {
        try {
          const v = (rawValues as any)[k]
          if (v === undefined) continue

          // Clonado superficial para objetos/arrays, preservando valores primitivos
          if (v !== null && typeof v === 'object') {
            if (Array.isArray(v)) {
              payload[k] = [...v]
            }
            else {
              payload[k] = { ...v }
            }
          }
          else {
            payload[k] = v
          }
        }
        catch (_e) {
          // Silenciosamente ignorar claves que no se pueden leer (como propiedades internas de Vue)
        }
      }

      // 🔄 Normalización de campos específicos
      if ('is_active' in payload) payload.is_active = !!payload.is_active

      // Normalización de 'effects' (debe ser Record, no Array)
      if (payload.effects) {
        if (Array.isArray(payload.effects) || payload.effects === '') {
          payload.effects = {}
        }
      }
      else {
        payload.effects = {}
      }

      // Normalización de 'tag_ids' (asegurar array de números)
      if (Array.isArray(payload.tag_ids)) {
        payload.tag_ids = payload.tag_ids.map(id => Number(id)).filter(id => !isNaN(id))
      }

      // 🔧 Normalización de campos numéricos obligatorios
      console.log('[DEBUG-MODALS] arcana_id before normalization:', payload.arcana_id, typeof payload.arcana_id)
      if (payload.arcana_id === null || payload.arcana_id === undefined || payload.arcana_id === '') {
        console.log('[DEBUG-MODALS] Removing arcana_id (null/undefined/empty)')
        delete payload.arcana_id
      }
      else {
        payload.arcana_id = Number(payload.arcana_id)
        console.log('[DEBUG-MODALS] arcana_id after Number():', payload.arcana_id, typeof payload.arcana_id)
      }

      // 🧹 Limpieza de artefactos del frontend
      const artifacts = ['language_is_fallback', 'language_code_resolved', '_isFallback', '_is_fallback']
      artifacts.forEach((k) => { if (k in payload) delete payload[k] })
      for (const k in payload) {
        if (k.startsWith('_')) delete payload[k]
      }

      // 🚀 Ejecución CRUD
      if (isEditing.value && payload.id != null) {
        if (typeof crud.update !== 'function') throw new Error('crud.update is not a function')
        console.log('[DEBUG-MODALS] Updating entity:', payload.id, payload)
        await crud.update(payload.id as string | number, payload)
      }
      else {
        if (typeof crud.create !== 'function') throw new Error('crud.create is not a function')
        console.log('[DEBUG-MODALS] Creating entity with payload:', payload)
        await crud.create(payload)
      }

      console.log('[DEBUG-MODALS] CRUD operation completed, refreshing list')
      console.log('[DEBUG-MODALS] About to call crud.fetchList()')
      await crud.fetchList?.()
      console.log('[DEBUG-MODALS] crud.fetchList() completed, list length:', crud.items.value?.length || 0)
      form.markClean({ updateInitial: true })
      persistence.clearDraft()
      isModalOpen.value = false
      toast?.add?.({ title: (t?.('common.saved') ?? 'Saved') as string, color: 'success' })
    }
    catch (err: any) {
      console.error('[useEntityModals] handleSubmit error:', err)
      toast?.add?.({
        title: (t?.('errors.update_failed') ?? 'Save failed') as string,
        description: err?.message || 'Unexpected error occurred',
        color: 'error',
      })
    }
    finally {
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
