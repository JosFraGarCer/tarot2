<!-- app/components/admin/RevisionsTable.vue -->
<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <UInput v-model="search" :placeholder="$t('common.search','Search')" icon="i-heroicons-magnifying-glass" class="w-full sm:w-72" />
      <USelectMenu v-model="entityType" :items="entityTypeItems" value-key="value" option-attribute="label" class="w-64" />
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600 dark:text-gray-300">{{ $t('common.status','Status') }}</span>
        <USelectMenu v-model="status" :items="statusItems" value-key="value" option-attribute="label" class="w-40" />
      </div>
      <div class="ml-auto flex gap-2">
        <UButton size="xs" variant="soft" color="neutral" @click="reload">{{ $t('common.refresh','Refresh') }}</UButton>
        <UButton size="xs" color="primary" :disabled="!isEditor || selectedIds.length===0" :title="!isEditor ? $t('common.noPermission') : ''" @click="bulkApprove">{{ $t('admin.revisions.approveSelected','Approve selected') }}</UButton>
        <UButton size="xs" color="error" variant="soft" :disabled="!isEditor || selectedIds.length===0" :title="!isEditor ? $t('common.noPermission') : ''" @click="bulkReject">{{ $t('admin.revisions.rejectSelected','Reject selected') }}</UButton>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th class="py-2 pr-2"><UCheckbox v-model="allChecked" :indeterminate="indeterminate" @change="toggleAll" /></th>
            <th class="py-2 pr-4">{{ $t('common.entity','Entity') }}</th>
            <th class="py-2 pr-4">{{ $t('common.language','Language') }}</th>
            <th class="py-2 pr-4">{{ $t('common.status','Status') }}</th>
            <th class="py-2 pr-4">{{ $t('common.createdAt','Created') }}</th>
            <th class="py-2 pr-4 text-right">{{ $t('common.actions','Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in items" :key="r.id" class="border-b border-gray-100 dark:border-gray-800">
            <td class="py-2 pr-2"><UCheckbox :model-value="selectedMap[r.id] || false" @update:model-value="v => toggleOne(r.id, v)" /></td>
            <td class="py-2 pr-4 text-xs">{{ r.entity_type }}#{{ r.entity_id }}</td>
            <td class="py-2 pr-4">{{ r.language_code || '—' }}</td>
            <td class="py-2 pr-4"><UBadge variant="soft">{{ r.status }}</UBadge></td>
            <td class="py-2 pr-4">{{ formatDate(r.created_at) }}</td>
            <td class="py-2 pr-0">
              <div class="flex justify-end gap-2">
                <UButton size="xs" icon="i-heroicons-document-magnifying-glass" variant="soft" :title="$t('admin.revisions.viewDiff','View diff')" @click="onViewDiff(r)" />
                <UButton size="xs" icon="i-heroicons-check-circle" color="primary" variant="soft" :disabled="!isEditor" :title="!isEditor ? $t('common.noPermission') : $t('status.approved','Approve')" @click="setOne(r.id, 'approved')" />
                <UButton size="xs" icon="i-heroicons-x-circle" color="error" variant="soft" :disabled="!isEditor" :title="!isEditor ? $t('common.noPermission') : $t('status.draft','Reject')" @click="setOne(r.id, 'rejected')" />
              </div>
            </td>
          </tr>
          <tr v-if="!items || items.length===0">
            <td colspan="6" class="py-6 text-center text-gray-400">{{ $t('common.noData','No data') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <JsonModal v-model="diffOpen" :value="currentDiff" :title="$t('admin.revisions.diffTitle','Revision diff')" />
  </div>
</template>

<script setup lang="ts">
import { useRevisions } from '@/composables/admin/useRevisions'
import JsonModal from '@/components/admin/JsonModal.vue'
import { formatDate } from '@/utils/date'
import { useCurrentUser } from '@/composables/users/useCurrentUser'

const { t } = useI18n()

const props = withDefaults(defineProps<{ defaultStatus?: 'draft'|'approved'|'rejected'|'published' }>(), { defaultStatus: 'approved' })

const search = ref('')
const entityType = ref<string | null>(null)
const entityTypeItems = [
  { label: t('filters.all','All'), value: null },
  { label: 'arcana_translation', value: 'arcana_translation' },
  { label: 'base_card_translations', value: 'base_card_translations' },
  { label: 'base_skills_translations', value: 'base_skills_translations' },
  { label: 'facet_translation', value: 'facet_translation' },
  { label: 'world_translations', value: 'world_translations' }
]

const { items, pending, error, meta, fetchList, setStatus, bulkSetStatus } = useRevisions()
const { currentUser } = useCurrentUser()
const isEditor = computed(() => {
  const roles = currentUser.value?.roles?.map(r => r.name) || []
  return roles.includes('admin') || roles.includes('editor')
})

const selectedMap = reactive<Record<number, boolean>>({})
const selectedIds = computed(() => Object.entries(selectedMap).filter(([,v]) => v).map(([k]) => Number(k)))
const allChecked = computed(() => items.value.length>0 && selectedIds.value.length === items.value.length)
const indeterminate = computed(() => selectedIds.value.length>0 && !allChecked.value)

function toggleOne(id:number, v:boolean) { selectedMap[id] = v }
function toggleAll() {
  const target = !allChecked.value
  for (const r of items.value) selectedMap[r.id] = target
}

async function reload() {
  await fetchList({ search: search.value, status: status.value, entity_type: entityType.value || undefined })
}

async function setOne(id:number, status:'approved'|'rejected'|'draft'|'published') {
  if (!isEditor.value) return
  await setStatus(id, status)
  await reload()
}

async function bulkApprove() {
  if (!isEditor.value || selectedIds.value.length===0) return
  await bulkSetStatus(selectedIds.value, 'approved')
  for (const id of selectedIds.value) selectedMap[id] = false
}
async function bulkReject() {
  if (!isEditor.value || selectedIds.value.length===0) return
  await bulkSetStatus(selectedIds.value, 'rejected')
  for (const id of selectedIds.value) selectedMap[id] = false
}

const diffOpen = ref(false)
const currentDiff = ref<any>({})
function onViewDiff(r:any) {
  currentDiff.value = r?.diff || {}
  diffOpen.value = true
}

// Status filter state and options
const status = ref<'draft'|'approved'|'rejected'|'published'>(props.defaultStatus)
const statusItems = [
  { label: 'Draft', value: 'draft' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Published', value: 'published' }
]

watch([status, entityType, search], () => { /* no auto fetch on each keystroke except when desired */ }, { deep: false })

watch(status, async () => { await reload() })

onMounted(() => { reload() })
</script>
