<!-- 
  Component: BasePreviewDrawer
  Purpose: Orchestrates EntityInspectorDrawer using EntityBaseContext
-->
<template>
  <EntityInspectorDrawer
    v-if="ctx.previewOpen.value"
    :open="ctx.previewOpen.value"
    @update:open="ctx.setPreviewOpen"
    :entity="ctx.previewEntityRow.value"
    :raw-entity="ctx.previewRawEntity.value"
    :kind="ctx.resolvedEntityKind.value"
    :capabilities="ctx.capabilities.value"
    :lang="ctx.localeCode.value"
  >
    <template #actions="{ entity: inspectedEntity }">
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          size="xs"
          color="primary"
          variant="soft"
          icon="i-heroicons-pencil"
          :aria-label="$t('ui.actions.quickEdit')"
          @click="inspectedEntity && ctx.onEdit(inspectedEntity.raw ?? inspectedEntity)"
        />
        <UButton
          size="xs"
          color="primary"
          variant="ghost"
          icon="i-heroicons-arrows-pointing-out"
          :aria-label="$t('ui.actions.fullEdit')"
          @click="inspectedEntity && ctx.openFullEditor(inspectedEntity.raw ?? inspectedEntity)"
        />
      </div>
    </template>
  </EntityInspectorDrawer>
</template>

<script setup lang="ts">
import { useEntityBase } from '~/composables/manage/useEntityBaseContext'
import EntityInspectorDrawer from '~/components/manage/EntityInspectorDrawer.vue'

const ctx = useEntityBase()
</script>
