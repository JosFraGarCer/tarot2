<!-- 
  Component: EntityPagination
  Purpose: Encapsulate pagination controls using the shared EntityBaseContext
-->
<template>
  <ClientOnly>
    <template #fallback>
      <div class="h-10" />
    </template>
    <PaginationControls
      v-if="ctx.crud?.pagination && ctx.viewMode.value !== 'tabla'"
      :page="ctx.pagination.page.value"
      :page-size="ctx.pagination.pageSize.value"
      :total-items="ctx.pagination.totalItems.value"
      :total-pages="ctx.pagination.totalPages.value"
      :page-size-items="ctx.pageSizeItems.value || []"
      @update:page="ctx.onPageChange"
      @update:page-size="ctx.onPageSizeChange"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import { useEntityBase } from '~/composables/manage/useEntityBaseContext'
import PaginationControls from '~/components/common/PaginationControls.vue'

const ctx = useEntityBase()
</script>
