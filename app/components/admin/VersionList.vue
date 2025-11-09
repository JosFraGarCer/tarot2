<!-- app/components/admin/VersionList.vue -->
<template>
  <div>
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th class="py-2 pr-4">{{ tt('versions.version', 'Version') }}</th>
            <th class="py-2 pr-4">{{ tt('common.description', 'Description') }}</th>
            <th class="py-2 pr-4">{{ tt('common.createdAt', 'Created') }}</th>
            <th class="py-2 pr-4">{{ tt('common.metadata', 'Metadata') }}</th>
            <th class="py-2 pr-4 text-right">{{ tt('common.actions', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in versions" :key="v.id" class="border-b border-gray-100 dark:border-gray-800">
            <td class="py-2 pr-4 font-mono">{{ v.version_semver }}</td>
            <td class="py-2 pr-4">{{ v.description }}</td>
            <td class="py-2 pr-4">{{ formatDate(v.created_at) }}</td>
            <td class="py-2 pr-4">
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                :title="tt('versions.viewMetadata', 'View metadata')"
                @click="$emit('meta', v)"
              >
                <div class="max-w-[30ch] truncate font-mono text-xs text-gray-500 dark:text-gray-400 text-left">{{ stringifyMeta(v.metadata) }}</div>
              </UButton>
            </td>
            <td class="py-2 pr-0">
              <div class="flex justify-end gap-2">
                <UButton size="xs" icon="i-heroicons-eye" variant="soft" :title="tt('common.view', 'View')" @click="$emit('view', v)" />
                <UButton size="xs" icon="i-heroicons-pencil-square" variant="soft" :title="tt('common.edit', 'Edit')" @click="$emit('edit', v)" />
                <UButton size="xs" icon="i-heroicons-trash" color="error" variant="soft" :title="tt('common.delete', 'Delete')" @click="$emit('delete', v)" />
              </div>
            </td>
          </tr>
          <tr v-if="!versions || versions.length === 0">
            <td colspan="5" class="py-6 text-center text-gray-400">{{ tt('common.noData', 'No data') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t, te } = useI18n()
import { formatDate } from '~/utils/date'

function tt(key: string, fallback: string) {
  return te(key) ? t(key) : fallback
}

function stringifyMeta(meta: any) {
  try {
    return JSON.stringify(meta)
  } catch {
    return ''
  }
}

// Props and emits
defineProps<{ versions: Array<{ id:number; version_semver:string; description:string|null; metadata:Record<string, any>; created_at:string }> }>()

defineEmits<{
  (e:'view', v:any): void
  (e:'delete', v:any): void
  (e:'edit', v:any): void
  (e:'meta', v:any): void
}>()

</script>
