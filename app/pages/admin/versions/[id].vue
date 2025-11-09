<!-- app/pages/admin/versions/[id].vue -->
<template>
  <div class="px-4">
    <UCard>
      <template #header>
        <div class="flex items-start justify-between w-full">
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ tt('domains.version.detailTitle', 'Version detail') }} · {{ version?.version_semver || ('#' + route.params.id) }}
            </h1>
            <p v-if="version" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ tt('ui.misc.createdAt', 'Created') }}: {{ formatDate(version.created_at) }}
            </p>
          </div>
          <div class="flex gap-2">
            <UButton icon="i-heroicons-pencil-square" color="primary" variant="soft" :label="tt('ui.actions.edit', 'Edit')" :disabled="!version" @click="openEdit" />
            <UButton icon="i-heroicons-code-bracket-square" color="neutral" variant="soft" :label="tt('domains.version.viewMetadata', 'View metadata')" :disabled="!version" @click="openMeta" />
            <UButton color="neutral" variant="soft" :label="tt('ui.actions.back', 'Back')" @click="goBack" />
          </div>
        </div>
      </template>

      <div v-if="pending" class="py-6">
        <USkeleton class="h-8 w-full mb-2" />
        <USkeleton class="h-8 w-full" />
      </div>
      <div v-else-if="error" class="mb-3">
        <UAlert color="error" :title="tt('ui.notifications.error', 'Error')" :description="String(error)" />
      </div>
      <div v-else-if="!version" class="text-gray-500">{{ tt('ui.empty.noData', 'No data') }}</div>
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left: details -->
        <div class="space-y-4">
          <div class="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="text-xs text-gray-500 mb-1">{{ tt('domains.version.version', 'Version') }}</div>
            <div class="font-mono">{{ version.version_semver }}</div>
          </div>
          <div class="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="text-xs text-gray-500 mb-1">{{ tt('ui.fields.description', 'Description') }}</div>
            <p class="whitespace-pre-wrap">{{ version.description }}</p>
          </div>
        </div>

        <!-- Right: metadata -->
        <div class="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs text-gray-500">{{ tt('ui.fields.metadata', 'Metadata') }}</div>
            <div class="flex gap-2">
              <UButton size="xs" variant="soft" color="neutral" icon="i-heroicons-clipboard" :title="tt('ui.actions.copy', 'Copy')" @click="copyMeta" />
              <UButton size="xs" variant="soft" color="neutral" icon="i-heroicons-code-bracket-square" :title="tt('domains.version.viewMetadata', 'View metadata')" @click="openMeta" />
            </div>
          </div>
          <pre class="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-auto max-h-96"><code>{{ prettyMeta }}</code></pre>
        </div>
      </div>
    </UCard>

    <!-- Modals -->
    <VersionModal v-model="editOpen" :value="version" @save="afterSave" />
    <JsonModal v-model="metaOpen" :value="version?.metadata" :title="tt('ui.fields.metadata', 'Metadata')" :description="tt('domains.version.viewMetadata', 'View metadata')" />
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '~/utils/date'
import VersionModal from '~/components/admin/VersionModal.vue'
import JsonModal from '~/components/admin/JsonModal.vue'
const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { t, te } = useI18n()
function tt(key: string, fallback: string) { return te(key) ? t(key) : fallback }

const id = computed(() => Number(route.params.id))
const pending = ref(true)
const error = ref<any>(null)
const version = ref<any>(null)

const prettyMeta = computed(() => JSON.stringify(version.value?.metadata ?? {}, null, 2))

async function load() {
  pending.value = true
  error.value = null
  try {
    const res = await $fetch<{ success: boolean; data: any }>(`/api/content_versions/${id.value}`)
    version.value = res?.data
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || String(e)
  } finally {
    pending.value = false
  }
}

onMounted(load)
watch(() => route.params.id, load)

function goBack() {
  router.push(localePath('/admin/versions'))
}
async function copyMeta() {
  try { await navigator.clipboard.writeText(prettyMeta.value) } catch {}
}

// Modals
const editOpen = ref(false)
const metaOpen = ref(false)
function openEdit() {
  if (!version.value) return
  editOpen.value = true
}
function openMeta() {
  metaOpen.value = true
}
async function afterSave() {
  await load()
}
</script>
