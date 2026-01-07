<!-- 
  Component: EntityViewsManager
  Purpose: Manage different view modes (tabla, tarjeta, classic, carta)
  Responsibilities: 
  - Switch between view modes
  - Render appropriate view component
  - Access state and actions from injected EntityBaseContext
-->
<template>
  <ClientOnly>
    <template #fallback>
      <div class="h-48 w-full"/>
    </template>
    
    <!-- Table View -->
    <div v-if="ctx.viewMode.value === 'tabla'">
      <ManageTableBridge
        :key="(ctx.crud?.resourcePath || 'entity') + ':tabla:bridge'"
        :items="ctx.crud.items.value"
        :columns="ctx.displayedColumns.value"
        :meta="ctx.crud.pagination.value"
        :loading="ctx.crud.loading.value"
        :selection="ctx.tableSelectionSource"
        :selectable="true"
        :entity-kind="ctx.resolvedEntityKind.value"
        :capabilities="ctx.capabilities.value"
        :title="ctx.label.value"
        :resource-path="ctx.crud.resourcePath"
        :entity-label="ctx.label.value"
        :entity-key="ctx.entityKey.value"
        :page-size-items="ctx.pageSizeItems.value || ctx.pagination.defaultPageSizes"
        density="regular"
        @update:page="ctx.onPageChange"
        @update:page-size="ctx.onPageSizeChange"
        @row:click="ctx.handleRowClick"
        @row:dblclick="ctx.handleRowDblClick"
      >
        <!-- Toolbar -->
        <template #toolbar="{ selected }">
          <div class="flex flex-wrap items-center gap-2">
            <UButton
              size="sm"
              color="primary"
              variant="soft"
              icon="i-heroicons-plus"
              @click="ctx.onCreate"
            >
              {{ $t('ui.actions.create') }}
            </UButton>
            <UBadge v-if="selected?.length" size="xs" variant="soft" color="primary">
              {{ selected.length }}
            </UBadge>
          </div>
        </template>

        <!-- Bulk Actions -->
        <template #bulk-actions="{ selected }">
          <div class="flex flex-wrap items-center gap-2">
            <UButton
              size="sm"
              variant="soft"
              color="neutral"
              icon="i-heroicons-arrow-up-tray"
              :disabled="!selected?.length"
              @click="ctx.exportSelected(selected as number[])"
            >
              {{ $t('ui.actions.export') }}
            </UButton>
            <UButton
              size="sm"
              variant="soft"
              color="neutral"
              icon="i-heroicons-arrow-path"
              :disabled="!selected?.length"
              @click="ctx.handleBulkUpdate(selected)"
            >
              {{ $t('ui.actions.update') }}
            </UButton>
          </div>
        </template>

        <!-- Selection -->
        <template #selection="{ selected }">
          <div class="flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <UBadge size="xs" color="primary" variant="soft">
              {{ selected.length }} {{ $t('ui.table.selected') }}
            </UBadge>
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              @click="ctx.tableSelectionSource.clear"
            >
              {{ $t('ui.actions.clear') }}
            </UButton>
          </div>
        </template>

        <!-- Empty State -->
        <template #empty>
          <div class="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <UIcon name="i-heroicons-magnifying-glass-circle" class="h-14 w-14 text-neutral-300 dark:text-neutral-600" />
            <div class="space-y-2">
              <p class="text-lg font-semibold text-neutral-700 dark:text-neutral-200">{{ $t('ui.empty.title') }}</p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ $t('ui.empty.subtitle') }}</p>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-2">
              <UButton color="primary" icon="i-heroicons-plus" @click="ctx.onCreate">
                {{ $t('ui.actions.create') }}
              </UButton>
              <UButton
                variant="ghost"
                color="neutral"
                icon="i-heroicons-arrow-path"
                @click="ctx.resetFilters"
              >
                {{ $t('ui.actions.resetFilters') }}
              </UButton>
            </div>
          </div>
        </template>

        <!-- Loading -->
        <template #loading>
          <div class="space-y-2 py-6">
            <USkeleton v-for="n in 6" :key="`row-skeleton-${n}`" class="h-10 w-full rounded" />
          </div>
        </template>

        <!-- Row Actions -->
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1">
            <UButton
              icon="i-heroicons-pencil"
              color="primary"
              variant="soft"
              size="xs"
              :aria-label="$t('ui.actions.quickEdit')"
              @click="ctx.onEdit(row.raw ?? row)"
            />
            <UButton
              icon="i-heroicons-arrows-pointing-out"
              color="primary"
              variant="ghost"
              size="xs"
              :aria-label="$t('ui.actions.fullEdit')"
              @click="ctx.openFullEditor(row.raw ?? row)"
            />
            <UButton
              v-if="row.raw && ctx.capabilities.value.hasPreview !== false"
              icon="i-heroicons-eye"
              color="neutral"
              variant="ghost"
              size="xs"
              :aria-label="$t('ui.actions.preview')"
              @click="ctx.onPreview(row.raw ?? row)"
            />
            <UButton
              v-if="row.raw"
              icon="i-heroicons-exclamation-triangle"
              color="warning"
              variant="soft"
              size="xs"
              aria-label="Feedback"
              @click="ctx.onFeedback(row.raw ?? row)"
            />
            <UButton
              v-if="row.raw && ctx.capabilities.value.hasTags !== false"
              icon="i-heroicons-tag"
              color="neutral"
              variant="soft"
              size="xs"
              aria-label="Tags"
              @click="ctx.onTags(row.raw ?? row)"
            />
            <UButton
              icon="i-heroicons-trash"
              color="error"
              variant="soft"
              size="xs"
              aria-label="Delete"
              @click="ctx.onDelete(row.raw ?? row)"
            />
          </div>
        </template>
      </ManageTableBridge>
    </div>

    <!-- Card View -->
    <div v-else-if="ctx.viewMode.value === 'tarjeta'">
      <EntityCards
        :key="(ctx.crud?.resourcePath || 'entity') + ':tarjeta'"
      />
    </div>

    <!-- Classic View -->
    <div v-else-if="ctx.viewMode.value === 'classic'">
      <EntityCardsClassic
        :key="(ctx.crud?.resourcePath || 'entity') + ':classic'"
      />
    </div>

    <!-- Carta View -->
    <div v-else class="text-xs text-neutral-500">
      <ManageEntityCarta
        :key="(ctx.crud?.resourcePath || 'entity') + ':carta'"
      />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useEntityBase } from '~/composables/manage/useEntityBaseContext'
import ManageTableBridge from '~/components/manage/ManageTableBridge.vue'
import EntityCards from '~/components/manage/view/EntityCards.vue'
import EntityCardsClassic from '~/components/manage/view/EntityCardsClassic.vue'
import ManageEntityCarta from '~/components/manage/view/EntityCarta.vue'

const ctx = useEntityBase()
</script>


