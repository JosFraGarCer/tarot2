<!-- 
  Component: EntityBase
  Purpose: Main orchestrator for entity management interface
  Architecture: Simplified version using useEntityBaseContext
-->
<template>
  <div class="flex flex-col gap-4">
    <!-- Error Alerts -->
    <EntityErrorAlerts />

    <!-- Filters -->
    <ManageEntityFilters />
    
    <!-- Actions Bar -->
    <EntityActionsBar />

    <!-- Views Manager -->
    <EntityViewsManager />

    <!-- Pagination -->
    <EntityPagination />

    <!-- Modals and Drawers -->
    <BasePreviewDrawer />
    <BaseFormModal />
    <BaseDeleteDialogs />
    <BaseImportModal />
    <BaseTagsModal />
    <BaseFeedbackModal />
    <BaseSlideover />
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue'
import { useEntityBaseContext } from '~/composables/manage/useEntityBaseContext'
import EntityErrorAlerts from '~/components/manage/EntityErrorAlerts.vue'
import ManageEntityFilters from '~/components/manage/EntityFilters.vue'
import EntityActionsBar from '~/components/manage/EntityActionsBar.vue'
import EntityViewsManager from '~/components/manage/EntityViewsManager.vue'
import EntityPagination from '~/components/manage/EntityPagination.vue'
import BasePreviewDrawer from '~/components/manage/base/BasePreviewDrawer.vue'
import BaseFormModal from '~/components/manage/base/BaseFormModal.vue'
import BaseDeleteDialogs from '~/components/manage/base/BaseDeleteDialogs.vue'
import BaseImportModal from '~/components/manage/base/BaseImportModal.vue'
import BaseTagsModal from '~/components/manage/base/BaseTagsModal.vue'
import BaseFeedbackModal from '~/components/manage/base/BaseFeedbackModal.vue'
import BaseSlideover from '~/components/manage/base/BaseSlideover.vue'
import type { AnyManageCrud } from '~/types/manage'
import type { EntityFilterConfig } from '~/composables/manage/useEntity'

type ManageViewMode = 'tabla' | 'tarjeta' | 'classic' | 'carta'

const props = withDefaults(defineProps<{
  label: string
  useCrud: () => AnyManageCrud
  viewMode: ManageViewMode
  entity: string
  templateKey?: string
  filtersConfig?: EntityFilterConfig
  columns?: unknown[]
  cardType?: boolean
  noTags?: boolean
  pageSizeItems?: Array<{ label: string; value: number }>
  onCreate?: () => void
  translatable?: boolean
}>(), {
  columns: () => [],
  cardType: false,
  noTags: false,
  pageSizeItems: undefined,
  onCreate: undefined,
  translatable: true
})

const emit = defineEmits<{ (e: 'create'): void }>()

useEntityBaseContext({
  ...toRefs(props),
  emit
})
</script>