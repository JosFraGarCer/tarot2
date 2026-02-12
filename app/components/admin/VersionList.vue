<!-- app/components/admin/VersionList.vue -->
<template>
  <div>
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
            <th class="py-3 pr-4 font-medium">{{ tt('domains.version.version', 'Version') }}</th>
            <th class="py-3 pr-4 font-medium">{{ tt('domains.version.release.label', 'Release type') }}</th>
            <th class="py-3 pr-4 font-medium">{{ tt('ui.fields.description', 'Description') }}</th>
            <th class="py-3 pr-4 font-medium">{{ tt('ui.misc.createdAt', 'Created') }}</th>
            <th class="py-3 pr-4 font-medium">{{ tt('ui.fields.metadata', 'Metadata') }}</th>
            <th class="py-3 pr-4 text-right font-medium">{{ tt('ui.table.actions', 'Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in versions" :key="v.id" class="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
            <td class="py-3 pr-4 font-mono font-medium">{{ v.version_semver }}</td>
            <td class="py-3 pr-4">
              <UBadge size="sm" color="primary" variant="soft">
                {{ releaseLabel(v.release) }}
              </UBadge>
            </td>
            <td class="py-3 pr-4 max-w-xs truncate text-neutral-600 dark:text-neutral-400">{{ v.description || '—' }}</td>
            <td class="py-3 pr-4 text-neutral-500 dark:text-neutral-400">{{ formatDate(v.created_at) }}</td>
            <td class="py-3 pr-4">
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                :title="tt('domains.version.viewMetadata', 'View metadata')"
                :aria-label="tt('domains.version.viewMetadata', 'View metadata')"
                @click="$emit('meta', v)"
              >
                <span class="max-w-[25ch] truncate font-mono text-xs text-neutral-500 dark:text-neutral-400">
                  {{ stringifyMeta(v.metadata) }}
                </span>
              </UButton>
            </td>
            <td class="py-3 pr-0">
              <div class="flex justify-end gap-1">
                <UButton
                  size="xs"
                  icon="i-heroicons-eye"
                  variant="soft"
                  color="neutral"
                  :title="tt('common.view', 'View')"
                  :aria-label="tt('common.view', 'View')"
                  @click="$emit('view', v)"
                />
                <UButton
                  size="xs"
                  icon="i-heroicons-pencil-square"
                  variant="soft"
                  :title="tt('ui.actions.edit', 'Edit')"
                  :aria-label="tt('ui.actions.edit', 'Edit')"
                  @click="$emit('edit', v)"
                />
                <UButton
                  size="xs"
                  icon="i-heroicons-trash"
                  color="error"
                  variant="soft"
                  :title="tt('ui.actions.delete', 'Delete')"
                  :aria-label="tt('ui.actions.delete', 'Delete')"
                  @click="$emit('delete', v)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!versions || versions.length === 0">
            <td colspan="6" class="py-8 text-center text-neutral-400">
              <div class="flex flex-col items-center gap-2">
                <UIcon name="i-heroicons-inbox" class="h-8 w-8 text-neutral-300" />
                <span>{{ tt('ui.empty.noData', 'No versions available') }}</span>
              </div>
            </td>
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

function releaseLabel(stage: string) {
  const key = `versions.release.${stage}`
  return te(key) ? t(key) : stage
}

function stringifyMeta(meta: any) {
  try {
    return JSON.stringify(meta)
  } catch {
    return ''
  }
}

// Props and emits
defineProps<{ versions: Array<{ id:number; version_semver:string; description:string|null; metadata:Record<string, any>; created_at:string; release: string }> }>()

defineEmits<{
  (e:'view', v:any): void
  (e:'delete', v:any): void
  (e:'edit', v:any): void
  (e:'meta', v:any): void
}>()

</script>
