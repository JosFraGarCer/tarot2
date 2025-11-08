import { ref } from 'vue'
import type { AnyManageCrud } from '@/types/manage'

export function useEntityDeletion(crud: AnyManageCrud, t?: (k: string) => string, toast?: any, localeCode?: () => string) {
  const deleteModalOpen = ref(false)
  const deleteTranslationModalOpen = ref(false)
  const deleteTranslationLoading = ref(false)
  const deleteTarget = ref<{ id: number | null }>({ id: null })
  const pendingDeleteTranslationItem = ref<any | null>(null)
  const saving = ref(false)

  function cancelDeleteDialogs() {
    deleteModalOpen.value = false
    deleteTranslationModalOpen.value = false
  }

  async function confirmDeleteEntity() {
    const id = deleteTarget.value?.id
    if (id == null) return
    try {
      saving.value = true
      await crud.remove?.(id)
      await crud.fetchList?.()
      deleteModalOpen.value = false
      toast?.add?.({ title: (t?.('common.deleted') ?? 'Deleted') as string, color: 'success' })
    } catch (e) {
      toast?.add?.({ title: (t?.('errors.delete_failed') ?? 'Delete failed') as string, description: crud.error?.value, color: 'error' })
    } finally {
      saving.value = false
    }
  }

  async function confirmDeleteTranslation() {
    if (!pendingDeleteTranslationItem.value) return
    deleteTranslationLoading.value = true
    try {
      await crud.remove?.(pendingDeleteTranslationItem.value.id)
      await crud.fetchList?.()
      deleteTranslationModalOpen.value = false
      toast?.add?.({ title: (t?.('common.deleted') ?? 'Deleted') as string, color: 'success' })
    } catch (e) {
      toast?.add?.({ title: (t?.('errors.delete_failed') ?? 'Delete failed') as string, description: crud.error?.value, color: 'error' })
    } finally {
      deleteTranslationLoading.value = false
    }
  }

  function onDelete(entity: any) {
    if (!entity) return
    const lc = String(localeCode?.() || '')
    const resolved = String(entity?.language_code_resolved || entity?.language_code || '')
    const isEnglishPage = lc === 'en'
    const isFallback = resolved && resolved !== lc

    if (isEnglishPage || isFallback) {
      deleteTarget.value = { id: entity.id }
      deleteModalOpen.value = true
    } else {
      pendingDeleteTranslationItem.value = entity
      deleteTranslationModalOpen.value = true
    }
  }

  return {
    deleteModalOpen,
    deleteTranslationModalOpen,
    deleteTranslationLoading,
    deleteTarget,
    pendingDeleteTranslationItem,
    saving,
    cancelDeleteDialogs,
    confirmDeleteEntity,
    confirmDeleteTranslation,
    onDelete,
  }
}
