// app/composables/manage/useManageColumns.ts
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

    add({ accessorKey: 'code', header: t('ui.fields.code') })

    // Entity-specific columns
    switch (entity) {
      case 'baseCard':
        add({ accessorKey: 'card_type', header: t('entities.cardType') })
        add({ accessorKey: 'world', header: t('ui.fields.world', 'World') })
        add({ accessorKey: 'tags', header: t('ui.fields.tags') })
        break
      case 'cardType':
        break
      case 'facet':
        add({ accessorKey: 'arcana', header: t('entities.arcana') })
        add({ accessorKey: 'tags', header: t('ui.fields.tags') })
        break
      case 'skill':
        add({ accessorKey: 'facet', header: t('entities.facet') })
        add({ accessorKey: 'tags', header: t('ui.fields.tags') })
        break
      case 'world':
      case 'arcana':
        add({ accessorKey: 'tags', header: t('ui.fields.tags') })
        break
      case 'tag':
        add({ accessorKey: 'parent', header: t('common.parent') })
        add({ accessorKey: 'category', header: t('ui.fields.category') })
        break
      default:
        break
    }

    // Editorial columns — shared across all entity types
    add({ accessorKey: 'version_semver', header: t('ui.fields.version', 'Version') })
    add({ accessorKey: 'translation_states', header: t('ui.fields.translations', 'Translations') })
    add({ accessorKey: 'updated_by', header: t('ui.fields.updatedBy', 'Updated by') })

    columnMemo.set(key, extras)
    return extras
  })
}
