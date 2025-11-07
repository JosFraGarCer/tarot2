<!-- /app/components/manage/ManageEntity.vue -->
<template>
  <div class="flex flex-col gap-4">

    <ManageEntityFilters
      :crud="crud"
      :config="filtersConfig"
      :label="label"
      :no-tags="noTags"
      :card-type="cardType"
      :on-create="onCreateClick"
    />

    <!-- <div v-if="viewMode === 'tabla'">
      <ManageEntityTable
        :crud="crud"
        :label="label"
        :columns="columns"
        @edit="onEdit"
        @delete="onDelete"
        @export="onExport"
        @batchUpdate="onBatchUpdate"
      />
    </div> -->
    <div>
      <ManageEntityCards
        :crud="crud"
        :label="label"
        :entity=entity
        :no-tags="noTags"
        :card-type="cardType"
        @edit="onEdit"
        @delete="onDelete"
        @feedback="onFeedback"
        @tags="onTags"
        @preview="onPreview"
      />
    </div>
    <!-- <div v-else class="text-xs text-neutral-500">[Card view coming soon]</div> -->

    <PaginationControls
      v-if="crud?.pagination"
      :page="page"
      :page-size="pageSize"
      :total-items="totalItems"
      :total-pages="totalPages"
      :page-size-items="pageSizeItems || defaultPageSizes"
      @update:page="onPageChange"
      @update:pageSize="onPageSizeChange"
    />

  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'
import PaginationControls from '~/components/common/PaginationControls.vue'
import ManageEntityFilters from '~/components/manage/EntityFilters.vue'
import ManageEntityTable from '~/components/manage/EntityTable.vue'
import ManageEntityCards from '~/components/manage/EntityCards.vue'

type ManageViewMode = 'tabla' | 'tarjeta' | 'carta'

const props = withDefaults(defineProps<{
  label: string
  useCrud: () => any
  viewMode: ManageViewMode
  entity: string
  filtersConfig?: Record<string, boolean>
  columns?: any[]
  cardType?: boolean
  noTags?: boolean
  pageSizeItems?: Array<{ label: string; value: number }>
  onCreate?: () => void
}>(), {
  filtersConfig: () => ({}),
  columns: () => [],
  cardType: false,
  noTags: false,
  pageSizeItems: undefined,
  onCreate: undefined
})

const crud = props.useCrud()
void crud.fetchList()

const defaultPageSizes = computed(() => ([
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 }
]))

const page = computed(() => crud.pagination?.page ?? crud.pagination?.value?.page ?? 1)
const pageSize = computed(() => crud.pagination?.pageSize ?? crud.pagination?.value?.pageSize ?? 20)
const totalItems = computed(() => crud.pagination?.totalItems ?? crud.pagination?.value?.totalItems ?? 0)

// ✅ totalPages correcto y reactivo
const totalPages = computed<number>(() => {
  const pag = crud.pagination?.value ?? crud.pagination
  const total = Number(pag?.totalItems ?? 0)
  const size = Number(pag?.pageSize ?? 1)
  return Math.max(1, Math.ceil(total / size))
})

function onPageChange(page: number) {
  if (!crud.pagination) return
  const pag = crud.pagination.value ?? crud.pagination
  pag.page = page
}

function onPageSizeChange(size: number) {
  if (!Number.isFinite(size) || size <= 0 || !crud.pagination) return
  const pag = crud.pagination.value ?? crud.pagination
  pag.pageSize = size
  pag.page = 1
}


function onEdit(entity: any) {
  // hook for edit action
  // integrate modal or route navigation as needed
  console.log('edit', props.label, entity)
}
function onDelete(entity: any) {
  console.log('delete', props.label, entity)
}
function onExport(ids: number[]) {
  console.log('export', props.label, ids)
}
function onBatchUpdate(ids: number[]) {
  console.log('batchUpdate', props.label, ids)
}
function onPreview(entity: any) {
  console.log('preview', props.label, entity)
}
function onFeedback(entity?: any) {
  console.log('feedback', props.label, entity)
}
function onTags(entity?: any) {
  console.log('tags', props.label, entity)
}
function onCreateClick() {
  if (props.onCreate) return props.onCreate()
  console.log('create', props.label)
}
</script>