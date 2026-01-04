// app/composables/manage/useOptimisticStatus.ts
import type { useToast } from '#imports'
import type { AnyManageCrud } from '@/types/manage'

export function useOptimisticStatus(crud: AnyManageCrud, t?: (k: string) => string, toast?: ReturnType<typeof useToast>) {
  async function onChangeStatus(entity: Record<string, unknown>, nextStatus: unknown) {
    if (!entity) return
    const prev = entity.status
    try {
      entity.status = nextStatus
      await crud.updateStatus?.(entity.id as number, nextStatus)
      toast?.add?.({ title: (t?.('status.updated') ?? 'Status updated') as string, color: 'success' })
    } catch {
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
