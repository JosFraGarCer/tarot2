<!-- 
  Component: EntityBase
  Purpose: Main orchestrator for entity management interface
  Architecture: Modern version with integrated header and independent scroll
-->
<template>
  <div class="flex flex-col h-full overflow-hidden bg-neutral-50 dark:bg-neutral-950">
    <!-- Modern Entity Header -->
    <header
      class="sticky top-0 z-20 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 font-sans">
      <div class="max-w-7xl mx-auto space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <!-- Title, Count and View Switcher -->
          <div class="flex items-center gap-4">
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2">
                <h1 class="text-xl font-black text-neutral-900 dark:text-white tracking-tight truncate">
                  {{ label }}
                </h1>
                <UBadge v-if="ctx.crud.pagination.value.totalItems" color="primary" variant="subtle" size="sm"
                  class="rounded-full px-2 font-bold">
                  {{ ctx.crud.pagination.value.totalItems }}
                </UBadge>
              </div>
              <p class="text-xs text-neutral-500 font-medium truncate">{{ $t('navigation.manage.description') }}</p>
            </div>

            <USeparator orientation="vertical" class="h-8 hidden md:block mx-1" />

            <!-- View Switcher (Centralized) -->
            <ClientOnly>
              <div class="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl flex items-center gap-0.5 shadow-inner">
                <UTooltip :text="$t('viewModes.card')">
                  <UButton icon="i-heroicons-square-3-stack-3d" size="sm"
                    :variant="ctx.viewMode.value === 'tarjeta' ? 'solid' : 'ghost'"
                    :color="ctx.viewMode.value === 'tarjeta' ? 'primary' : 'neutral'"
                    class="rounded-lg transition-all duration-200"
                    :class="{ 'text-default! hover:bg-elevated! active:bg-elevated!': ctx.viewMode.value !== 'tarjeta' }"
                    @click="ctx.setViewMode('tarjeta')" />
                </UTooltip>
                <UTooltip :text="$t('viewModes.classic')">
                  <UButton icon="i-heroicons-view-columns" size="sm"
                    :variant="ctx.viewMode.value === 'classic' ? 'solid' : 'ghost'"
                    :color="ctx.viewMode.value === 'classic' ? 'primary' : 'neutral'"
                    class="rounded-lg transition-all duration-200"
                    :class="{ 'text-default! hover:bg-elevated! active:bg-elevated!': ctx.viewMode.value !== 'classic' }"
                    @click="ctx.setViewMode('classic')" />
                </UTooltip>
                <UTooltip :text="$t('viewModes.carta')">
                  <UButton icon="i-heroicons-rectangle-stack" size="sm"
                    :variant="ctx.viewMode.value === 'carta' ? 'solid' : 'ghost'"
                    :color="ctx.viewMode.value === 'carta' ? 'primary' : 'neutral'"
                    class="rounded-lg transition-all duration-200"
                    :class="{ 'text-default! hover:bg-elevated! active:bg-elevated!': ctx.viewMode.value !== 'carta' }"
                    @click="ctx.setViewMode('carta')" />
                </UTooltip>
                <UTooltip :text="$t('viewModes.table')">
                  <UButton icon="i-heroicons-table-cells" size="sm"
                    :variant="ctx.viewMode.value === 'tabla' ? 'solid' : 'ghost'"
                    :color="ctx.viewMode.value === 'tabla' ? 'primary' : 'neutral'"
                    class="rounded-lg transition-all duration-200"
                    :class="{ 'text-default! hover:bg-elevated! active:bg-elevated!': ctx.viewMode.value !== 'tabla' }"
                    @click="ctx.setViewMode('tabla')" />
                </UTooltip>
              </div>
              <template #fallback>
                <div
                  class="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl flex items-center gap-0.5 shadow-inner h-[38px] w-[156px]">
                  <div v-for="i in 4" :key="i"
                    class="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
                </div>
              </template>
            </ClientOnly>
          </div>

          <!-- Quick Actions -->
          <div class="flex items-center gap-2">
            <!-- Botones de Exportar/Importar -->
            <div
              class="hidden sm:flex items-center gap-1 mr-2 border-r border-neutral-200 dark:border-neutral-800 pr-2">
              <UTooltip :text="$t('ui.actions.export')">
                <UButton icon="i-heroicons-arrow-up-tray" size="sm" color="neutral" variant="ghost" class="rounded-xl"
                  :loading="ctx.exporting.value" @click="ctx.exportAll()" />
              </UTooltip>
              <UTooltip :text="$t('ui.actions.import')">
                <UButton icon="i-heroicons-arrow-down-tray" size="sm" color="neutral" variant="ghost" class="rounded-xl"
                  @click="ctx.openImportModal()" />
              </UTooltip>
            </div>

            <div class="relative group hidden sm:block">
              <UInput v-model="(ctx.crud.filters as any).search" icon="i-heroicons-magnifying-glass" size="sm"
                :placeholder="$t('ui.actions.search')" class="w-48 lg:w-64" :ui="{ base: 'rounded-xl' }" />
            </div>
            <UButton icon="i-heroicons-plus-circle" color="primary" size="sm" :label="$t('ui.actions.create')"
              class="rounded-xl shadow-lg shadow-primary-500/25 px-4 font-bold transition-all hover:scale-105 active:scale-95"
              @click="ctx.onCreate()" />
          </div>
        </div>

        <!-- Integrated Filters -->
        <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
          <ManageEntityFilters />
        </div>
      </div>
    </header>

    <!-- Main Content Area with Independent Scroll -->
    <div class="flex-1 overflow-y-auto custom-scrollbar relative bg-neutral-50/50 dark:bg-neutral-950/50">
      <div class="max-w-7xl mx-auto p-6 min-h-full flex flex-col">
        <!-- Error Alerts -->
        <EntityErrorAlerts class="mb-4" />

        <!-- Views Manager -->
        <div class="flex-1">
          <BulkActionsBar v-if="ctx.tableSelectionSource.selectedList.value.length > 0"
            :selected="ctx.tableSelectionSource.selectedList.value"
            class="mb-4 static! ring-0! shadow-none! bg-primary-50/50! dark:bg-primary-900/10! border-primary-200! dark:border-primary-800!">
            <template #default="{ selected }">
              <div class="flex items-center gap-2">
                <UButton size="sm" variant="soft" color="neutral" icon="i-heroicons-arrow-up-tray"
                  @click="ctx.exportSelected(selected as number[])">
                  {{ $t('ui.actions.export') }}
                </UButton>
                <UButton size="sm" variant="soft" color="neutral" icon="i-heroicons-arrow-path"
                  @click="ctx.handleBulkUpdate(selected)">
                  {{ $t('ui.actions.update') }}
                </UButton>
                <USeparator orientation="vertical" class="h-4 mx-1" />
                <UButton size="sm" variant="ghost" color="neutral" @click="ctx.tableSelectionSource.clear()">
                  {{ $t('ui.actions.clear') }}
                </UButton>
              </div>
            </template>
          </BulkActionsBar>
          <EntityViewsManager />
        </div>

        <!-- Floating Pagination -->
        <footer class="mt-12 sticky bottom-6 z-10 mx-auto">
          <div
            class="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 min-w-[320px]">
            <EntityPagination />
          </div>
        </footer>
      </div>
    </div>

    <!-- Modals and Drawers (Global Context) -->
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
import EntityViewsManager from '~/components/manage/EntityViewsManager.vue'
import EntityPagination from '~/components/manage/EntityPagination.vue'
import BulkActionsBar from '~/components/manage/BulkActionsBar.vue'
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

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'update:viewMode', value: ManageViewMode): void
}>()

const ctx = useEntityBaseContext({
  ...toRefs(props),
  emit,
  emitUpdateViewMode: (v) => emit('update:viewMode', v as ManageViewMode)
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e5e5;
  border-radius: 10px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #262626;
}
</style>