// app/composables/manage/useEntityDeletion.ts
import { computed, ref } from 'vue'
import type { useToast } from '#imports'
import type { AnyManageCrud } from '@/types/manage'
import { useEntityCapabilities } from '~/composables/common/useEntityCapabilities'

export function useEntityDeletion(
  crud: AnyManageCrud,
  t?: (k: string) => string,
  toast?: ReturnType<typeof useToast>,
  localeCode?: () => string,
  opts?: { translatable?: boolean }
) {
  const deleteModalOpen = ref(false)
  const deleteTranslationModalOpen = ref(false)
  const deleteTranslationLoading = ref(false)
  const deleteTarget = ref<{ id: number | null }>({ id: null })
  const pendingDeleteTranslationItem = ref<Record<string, unknown> | null>(null)
  const saving = ref(false)

  const capabilities = useEntityCapabilities()
  const isTranslatable = computed(() => {
    if (opts?.translatable !== undefined && opts.translatable !== null) {
      return Boolean(opts.translatable)
    }
    return capabilities.value.translatable !== false
  })

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
    } catch {
      toast?.add?.({
        title: (t?.('errors.delete_failed') ?? 'Delete failed') as string,
        description: crud.actionError?.value || crud.listError?.value || '',
        color: 'error',
      })
    } finally {
      saving.value = false
    }
  }

  async function confirmDeleteTranslation() {
    if (!pendingDeleteTranslationItem.value) return
    deleteTranslationLoading.value = true
    try {
      await crud.remove?.(pendingDeleteTranslationItem.value.id as number | string)
      await crud.fetchList?.()
      deleteTranslationModalOpen.value = false
      toast?.add?.({ title: (t?.('common.deleted') ?? 'Deleted') as string, color: 'success' })
    } catch {
      toast?.add?.({
        title: (t?.('errors.delete_failed') ?? 'Delete failed') as string,
        description: crud.actionError?.value || crud.listError?.value || '',
        color: 'error',
      })
    } finally {
      deleteTranslationLoading.value = false
    }
  }

  function onDelete(entity: Record<string, unknown>) {
    if (!entity) return
    // If entity is explicitly non-translatable, always open entity delete modal
    if (!isTranslatable.value) {
      deleteTarget.value = { id: (entity.id as number) ?? null }
      deleteModalOpen.value = true
      return
    }
    const lc = String(localeCode?.() || '')
    const resolved = String(entity.language_code_resolved || entity.language_code || '')
    const isEnglishPage = lc === 'en'
    const isFallback = resolved && resolved !== lc

    if (isEnglishPage || isFallback || !isTranslatable.value) {
      deleteTarget.value = { id: entity.id as number }
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
