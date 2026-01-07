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
    
    // In Tarot2, we now use the backend batch endpoint instead of sequential client calls
    // to ensure atomicity and better performance.
    try {
      notify(t('ui.actions.batchUpdateStarted', { total: ids.length }))
      
      const res = await $fetch(`${crud.resourcePath}/batch`, {
        method: 'PATCH',
        body: { ids, is_active: true } // Example: activating items in bulk
      })

      // @ts-ignore
      const updated = res?.data?.updated ?? 0
      notify(t('ui.actions.batchUpdateCompleted', { total: updated }))
      await crud.fetchList?.()
    } catch (e: any) {
      toast?.add?.({
        title: t('errors.batch_update_failed') || 'Batch Update Failed',
        description: e.message,
        color: 'error'
      })
    }
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
