// app/composables/manage/useFormPersistence.ts
import { watch, onMounted } from 'vue'
import type { FormStateControls } from './useFormState'

export function useFormPersistence<T extends Record<string, unknown>>(
  entityKey: string,
  form: FormStateControls<T>,
  options: { enabled: boolean } = { enabled: true }
) {
  const STORAGE_KEY_PREFIX = 'tarot2_form_draft:'

  function getStorageKey() {
    return `${STORAGE_KEY_PREFIX}${entityKey}`
  }

  function saveDraft() {
    if (!options.enabled) return
    const data = form.toObject()
    // Solo guardamos si hay algo relevante (por ejemplo, si es dirty)
    if (form.isDirty.value) {
      localStorage.setItem(getStorageKey(), JSON.stringify({
        values: data,
        timestamp: Date.now()
      }))
    }
  }

  function loadDraft() {
    if (!options.enabled) return
    const raw = localStorage.getItem(getStorageKey())
    if (!raw) return

    try {
      const { values, timestamp } = JSON.parse(raw)
      // Si el borrador tiene más de 24h, lo ignoramos
      if (Date.now() - timestamp > 1000 * 60 * 60 * 24) {
        clearDraft()
        return
      }
      
      // Aplicamos el borrador al formulario
      form.patch(values, { markDirty: true })
    } catch (e) {
      console.error('Failed to load form draft', e)
    }
  }

  function clearDraft() {
    localStorage.removeItem(getStorageKey())
  }

  onMounted(() => {
    if (options.enabled) {
      // Intentar cargar borrador al montar si el formulario está vacío/en creación
      // Nota: onEdit suele sobreescribir el estado, así que esto es más útil para "Create"
      // o para recuperar tras un crash.
    }
  })

  // Watch for changes to save automatically
  watch(form.values, () => {
    if (form.isDirty.value) {
      saveDraft()
    }
  }, { deep: true })

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft: () => !!localStorage.getItem(getStorageKey())
  }
}
