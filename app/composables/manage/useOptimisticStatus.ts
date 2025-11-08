import type { AnyManageCrud } from '@/types/manage'

export function useOptimisticStatus(crud: AnyManageCrud, t?: (k: string) => string, toast?: any) {
  async function onChangeStatus(entity: any, nextStatus: any) {
    if (!entity) return
    const prev = entity.status
    try {
      entity.status = nextStatus
      await crud.updateStatus?.(entity.id, nextStatus)
      toast?.add?.({ title: (t?.('status.updated') ?? 'Status updated') as string, color: 'success' })
    } catch (e) {
      entity.status = prev
      toast?.add?.({
        title: (t?.('errors.update_failed') ?? 'Update failed') as string,
        description: crud.actionError?.value || crud.listError?.value || '',
        color: 'error',
      })
    }
  }

  return { onChangeStatus }
}
