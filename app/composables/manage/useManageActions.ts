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

  function onBatchUpdate(ids: number[]) {
    notify(ids.length ? `Batch update ${ids.length}` : 'Batch update triggered')
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
