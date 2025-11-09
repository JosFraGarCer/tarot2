<!-- app/components/admin/RevisionHistory.vue -->
<template>
  <UModal v-model:open="open" :title="title">
    <template #body>
      <div class="space-y-3">
        <div v-if="error">
          <UAlert color="error" :title="$t('ui.notifications.error','Error')" :description="String(error)" />
        </div>
        <div v-if="pending" class="py-6">
          <USkeleton class="h-8 w-full mb-2" />
          <USkeleton class="h-8 w-full" />
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th class="py-2 pr-4">{{ $t('admin.revisionsHistory.status','Status') }}</th>
                <th class="py-2 pr-4">{{ $t('features.admin.revisionsHistory.source','Source') }}</th>
                <th class="py-2 pr-4">{{ $t('admin.revisionsHistory.language','Language') }}</th>
                <th class="py-2 pr-4">{{ $t('admin.revisionsHistory.author','Author') }}</th>
                <th class="py-2 pr-4">{{ $t('admin.revisionsHistory.version','Version') }}</th>
                <th class="py-2 pr-4">{{ $t('ui.misc.createdAt','Created') }}</th>
                <th class="py-2 pr-4 text-right">{{ $t('ui.table.actions','Actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in items" :key="r.id" class="border-b border-gray-100 dark:border-gray-800">
                <td class="py-2 pr-4"><UBadge variant="soft">{{ r.status }}</UBadge></td>
                <td class="py-2 pr-4">
                  <UBadge :color="r.language_code ? 'primary' : 'neutral'" variant="soft">
                    {{ r.language_code ? $t('features.admin.revisionsHistory.translation','Translation ({lang})').replace('{lang}', String(r.language_code)) : $t('features.admin.revisionsHistory.baseEntity','Base entity') }}
                  </UBadge>
                </td>
                <td class="py-2 pr-4">{{ r.language_code || '—' }}</td>
                <td class="py-2 pr-4">{{ (r as any).author_name || r.created_by || '—' }}</td>
                <td class="py-2 pr-4">{{ r.content_version_id || '—' }}</td>
                <td class="py-2 pr-4">{{ formatDate(r.created_at) }}</td>
                <td class="py-2 pr-0">
                  <div class="flex justify-end gap-2">
                    <UButton size="xs" icon="i-heroicons-document-magnifying-glass" variant="soft" :title="$t('features.admin.revisionsHistory.viewDiff','View diff')" @click="onViewDiff(r)" />
                    <UButton size="xs" icon="i-heroicons-rectangle-stack" variant="soft" :title="$t('features.admin.revisionsHistory.viewSnapshots','View snapshots')" @click="onViewSnapshots(r)" />
                  </div>
                </td>
              </tr>
              <tr v-if="!items || items.length===0">
                <td colspan="7" class="py-6 text-center text-gray-400">{{ $t('ui.empty.noData','No data') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <JsonModal v-model="diffOpen" :value="currentDiff" :title="$t('features.admin.revisionsHistory.viewDiff','View diff')" />

        <UModal v-model:open="snapshotsOpen" :title="$t('features.admin.revisionsHistory.viewSnapshots','View snapshots')">
          <template #body>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <UCard>
                <template #header>Prev</template>
                <pre class="text-xs overflow-auto max-h-80">{{ formatJson(currentPrev) }}</pre>
              </UCard>
              <UCard>
                <template #header>Next</template>
                <pre class="text-xs overflow-auto max-h-80">{{ formatJson(currentNext) }}</pre>
              </UCard>
            </div>
          </template>
        </UModal>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import JsonModal from '@/components/admin/JsonModal.vue'
import { useRevisions } from '@/composables/admin/useRevisions'
import { formatDate } from '@/utils/date'

const props = defineProps<{ open: boolean; entityType: string; entityId: number; languageCode?: string | null }>()
const open = defineModel<boolean>('open')

const { items, pending, error, fetchByEntity } = useRevisions()

const title = computed(() => `${useI18n().t('features.admin.revisionsHistory.title','Revision history')} · ${props.entityType} #${props.entityId}`)

watch(() => [props.entityType, props.entityId, props.languageCode, open.value], async ([et, id, lang, isOpen]) => {
  if (isOpen && et && id) await fetchByEntity(et, id, lang || undefined)
}, { immediate: true })

const diffOpen = ref(false)
const currentDiff = ref<any>({})
function onViewDiff(r:any) {
  currentDiff.value = r?.diff || {}
  diffOpen.value = true
}

const snapshotsOpen = ref(false)
const currentPrev = ref<any>({})
const currentNext = ref<any>({})
function onViewSnapshots(r:any) {
  currentPrev.value = r?.prev_snapshot || {}
  currentNext.value = r?.next_snapshot || {}
  snapshotsOpen.value = true
}

function formatJson(obj:any) { try { return JSON.stringify(obj, null, 2) } catch { return String(obj) } }
</script>
