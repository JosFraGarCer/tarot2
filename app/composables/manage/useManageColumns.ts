import { computed, type ComputedRef } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { EntityRow } from '~/components/manage/view/EntityTable.vue'
import type { AnyManageCrud } from '@/types/manage'
import { useI18n } from '#imports'

export interface ManageColumnsOptions {
  entity: string
  crud: AnyManageCrud
}

export function useManageColumns(options: ManageColumnsOptions): ComputedRef<TableColumn<EntityRow>[]> {
  const { t } = useI18n()
  const { entity, crud } = options
  const columnMemo = new Map<string, TableColumn<EntityRow>[]>()

  return computed(() => {
    const key = `${entity}::${crud.lang.value}`
    const cached = columnMemo.get(key)
    if (cached) return cached

    const extras: TableColumn<EntityRow>[] = []

    const add = (column?: TableColumn<EntityRow>) => {
      if (!column) return
      extras.push(column)
    }

    add({ accessorKey: 'code', header: t('common.code') })
    add({ accessorKey: 'lang', header: t('common.language') })

    switch (entity) {
      case 'baseCard':
        add({ accessorKey: 'card_type', header: t('entities.cardType') })
        add({ accessorKey: 'tags', header: t('common.tags') })
        break
      case 'cardType':
        add({ accessorKey: 'category', header: t('common.category') })
        break
      case 'facet':
        add({ accessorKey: 'arcana', header: t('entities.arcana') })
        add({ accessorKey: 'tags', header: t('common.tags') })
        break
      case 'skill':
        add({ accessorKey: 'facet', header: t('entities.facet') })
        add({ accessorKey: 'tags', header: t('common.tags') })
        break
      case 'world':
      case 'arcana':
        add({ accessorKey: 'tags', header: t('common.tags') })
        break
      case 'tag':
        add({ accessorKey: 'parent', header: t('common.parent') })
        add({ accessorKey: 'category', header: t('common.category') })
        break
      default:
        break
    }

    add({ accessorKey: 'updated_at', header: t('common.updatedAt') })

    columnMemo.set(key, extras)
    return extras
  })
}
