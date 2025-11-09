<!-- app/components/admin/FeedbackList.vue -->
<template>
  <div>
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th class="py-2 pr-2"><UCheckbox :model-value="allChecked" :indeterminate="indeterminate" @update:model-value="toggleAll" /></th>
            <th class="py-2 pr-4">{{ $t('features.admin.feedback.card', 'Card') }}</th>
            <th class="py-2 pr-4">{{ $t('features.admin.feedback.title', 'Title') }}</th>
            <th class="py-2 pr-4">{{ $t('features.admin.feedback.category', 'Category') }}</th>
            <th class="py-2 pr-4">{{ $t('features.admin.feedback.status', 'Status') }}</th>
            <th class="py-2 pr-4">{{ $t('ui.misc.createdAt', 'Created') }}</th>
            <th class="py-2 pr-4 text-right">{{ $t('ui.table.actions', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="f in items"
            :key="f.id"
            :class="[
              'transition-colors border-b border-gray-100 dark:border-gray-800 border-l',
              (Date.now() - new Date(f.created_at).getTime() < 24 * 60 * 60 * 1000)
                ? 'border-l-4 border-blue-400 bg-blue-50/30 dark:bg-blue-950/20'
                : 'border-l border-gray-100'
            ]"
          >
            <td class="py-2 pr-2"><UCheckbox :model-value="isSelected(f.id)" @update:model-value="v => toggleOne(f.id, v)" /></td>
            <td class="py-2 pr-4 font-mono">{{ f.card_code }}</td>
            <td class="py-2 pr-4">
              <div class="flex items-center gap-2">
                <UTooltip :text="$t('features.admin.feedback.createdBy','Created by') + ': ' + (f.created_by_name || 'Unknown')">
                  <UAvatar size="xs" :text="(f.created_by_name?.[0] || '?').toUpperCase()" />
                </UTooltip>
                <div class="font-medium flex items-center gap-2">
                  <span class="flex items-center">
                    {{ f.title }}
                    <UIcon
                      v-if="Date.now() - new Date(f.created_at).getTime() < 24 * 60 * 60 * 1000"
                      name="i-heroicons-sparkles"
                      class="text-blue-400 ml-1"
                      :title="$t('features.admin.feedback.new','New feedback')"
                    />
                    <UIcon
                      v-if="f.detail && f.detail.includes('--- [')"
                      name="i-heroicons-chat-bubble-left-ellipsis"
                      class="text-gray-400 ml-1"
                      :title="$t('features.admin.feedback.notes.hasNotes','Has internal notes')"
                    />
                  </span>
                  <UBadge v-if="f.language_code" variant="soft" color="primary">{{ String(f.language_code).toUpperCase() }}</UBadge>
                </div>
              </div>
              <div v-if="f.detail" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[60ch]">{{ f.detail }}</div>
            </td>
            <td class="py-2 pr-4">
              <UBadge variant="soft">{{ f.type }}</UBadge>
            </td>
            <td class="py-2 pr-4">
              <UBadge :color="f.status === 'resolved' ? 'green' : 'primary'" variant="soft">{{ f.status }}</UBadge>
            </td>
            <td class="py-2 pr-4">{{ formatDate(f.created_at) }}</td>
            <td class="py-2 pr-0">
              <div class="flex justify-end gap-2">
                <UButton size="xs" icon="i-heroicons-code-bracket-square" variant="soft" :title="$t('features.admin.feedback.viewJson','View JSON')" @click="$emit('view-json', f)" />
                <UButton size="xs" icon="i-heroicons-eye" variant="soft" :title="$t('ui.actions.preview','Preview')" @click="$emit('view', f)" />
                <UButton
                  size="xs"
                  icon="i-heroicons-pencil-square"
                  variant="soft"
                  :disabled="!isEditor"
                  :title="!isEditor ? $t('ui.messages.noPermission','No permission') : $t('features.admin.feedback.actions.viewNotes','View notes')"
                  @click="$emit('notes', f)"
                />
                <UButton
                  v-if="f.entity_type && f.entity_id"
                  size="xs"
                  icon="i-heroicons-link"
                  variant="soft"
                  :title="$t('features.admin.feedback.actions.openEntity','Open related entity')"
                  @click="openEntity(f)"
                />
                <UButton
                  v-if="isEditor && f.status === 'resolved'"
                  size="xs"
                  icon="i-heroicons-arrow-path"
                  variant="soft"
                  :title="$t('features.admin.feedback.actions.reopen','Reopen')"
                  @click="$emit('reopen', f)"
                />
                <UButton size="xs" icon="i-heroicons-check-circle" color="primary" variant="soft" :disabled="!isEditor || f.status==='resolved'" :title="!isEditor ? $t('ui.messages.noPermission','No permission') : $t('ui.actions.resolve','Resolve')" @click="$emit('resolve', f)" />
                <UButton size="xs" icon="i-heroicons-trash" color="error" variant="soft" :title="$t('ui.actions.delete','Delete')" @click="$emit('delete', f)" />
              </div>
            </td>
          </tr>
          <tr v-if="!items || items.length === 0">
            <td colspan="7" class="py-6 text-center text-gray-400">{{ $t('ui.empty.noData','No data') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/date'
import { navigateTo } from '#app'

const props = defineProps<{ items: Array<{ id:number; card_code:string; title:string; detail?:string|null; type:'bug'|'suggestion'|'balance'; status:'open'|'resolved'; created_at:string; entity_type?: string; entity_id?: number; language_code?: string|null; created_by_name?: string|null }>; isEditor?: boolean }>()
const selected = defineModel<number[]>('selected', { default: [] })

function isSelected(id:number) { return selected.value.includes(id) }
function toggleOne(id:number, v:boolean) {
  const set = new Set(selected.value)
  if (v) set.add(id); else set.delete(id)
  selected.value = Array.from(set)
}
const allChecked = computed(() => props.items?.length>0 && selected.value.length === props.items.length)
const indeterminate = computed(() => selected.value.length>0 && !allChecked.value)
function toggleAll(v:boolean) {
  if (v) selected.value = props.items.map(i => i.id)
  else selected.value = []
}

function openEntity(f: any) {
  if (f?.entity_type && f?.entity_id) {
    navigateTo(`/admin/versions/${f.entity_type}/${f.entity_id}`)
  }
}
</script>
