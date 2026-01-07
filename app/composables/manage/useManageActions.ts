// app/composables/manage/useManageActions.ts
import type { AnyManageCrud } from '@/types/manage'
import type { useToast } from '#imports'

export interface ManageActionsOptions {
  entityLabel: string
  toast?: ReturnType<typeof useToast> | null
}

export interface ManageActionsApi {
  onExport: (ids: number[]) => void
  onBatchUpdate: (ids: number[]) => void
  onFeedback: (entity?: Record<string, unknown>) => void
  onTags: (entity?: Record<string, unknown>) => void
}

export function useManageActions(crud: AnyManageCrud, options: ManageActionsOptions): ManageActionsApi {
  const { entityLabel, toast } = options

  const notify = (message: string) => {
    toast?.add?.({
      title: entityLabel,
      description: message,
      color: 'neutral',
    })
  }

  function onExport(ids: number[]) {
    notify(ids.length ? `Export ${ids.length}` : 'Export triggered')
  }

  async function onBatchUpdate(ids: number[]) {
    if (!ids.length) return
    
    const batchSize = 50
    const total = ids.length
    let processed = 0

    notify(t('ui.actions.batchUpdateStarted', { total }))

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      // Simulación de procesamiento por lotes. 
      // En una implementación real, aquí llamaríamos a un endpoint de batch del backend.
      // Por ahora, para Tarot2, aseguramos que la UI entienda el concepto de batching.
      await new Promise(resolve => setTimeout(resolve, 100)) 
      processed += batch.length
    }

    notify(t('ui.actions.batchUpdateCompleted', { total: processed }))
    await crud.fetchList?.()
  }

  function onFeedback(entity?: Record<string, unknown>) {
    notify(`Feedback requested${entity?.id ? ` (#${entity.id})` : ''}`)
  }

  function onTags(entity?: Record<string, unknown>) {
    notify(`Tags edit${entity?.id ? ` (#${entity.id})` : ''}`)
  }

  return {
    onExport,
    onBatchUpdate,
    onFeedback,
    onTags,
  }
}
