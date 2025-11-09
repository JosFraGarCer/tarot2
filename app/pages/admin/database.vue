<!-- app/pages/admin/database.vue -->
<template>
  <div class="space-y-6 p-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Database</h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400">Import and Export your data in JSON or SQL.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">JSON</h2>
            <div class="flex gap-2">
              <UButton size="xs" icon="i-heroicons-arrow-up-tray" variant="soft" color="neutral" :label="$t('ui.actions.export')" @click="exportJson" />
              <UButton size="xs" icon="i-heroicons-arrow-down-tray" variant="soft" color="neutral" :label="$t('ui.actions.import')" @click="openJsonImport" />
            </div>
          </div>
        </template>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">Full database export/import as JSON.</p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">SQL</h2>
            <div class="flex gap-2">
              <UButton size="xs" icon="i-heroicons-arrow-up-tray" variant="soft" color="neutral" :label="$t('ui.actions.export')" @click="exportSql" />
              <UButton size="xs" icon="i-heroicons-arrow-down-tray" variant="soft" color="neutral" :label="$t('ui.actions.import')" @click="openSqlImport" />
            </div>
          </div>
        </template>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">Full database export/import as SQL dump.</p>
      </UCard>
    </div>

    <!-- JSON Import Modal -->
    <ImportJsonModal
      :open="jsonModalOpen"
      :title="$t('ui.actions.import') + ' JSON'"
      :description="$t('importExport.import.instructions.descriptionMultiLang')"
      :confirm-label="$t('importExport.import.actions.confirm')"
      :cancel-label="$t('ui.actions.cancel')"
      :file-label="$t('importExport.import.instructions.fileLabel')"
      :loading="jsonImportLoading"
      :error="jsonImportError"
      @update:open="(v) => (jsonModalOpen = v)"
      @submit="handleJsonImport"
      @cancel="() => (jsonModalOpen = false)"
    />

    <!-- SQL Import Modal -->
    <UModal v-model:open="sqlModalOpen" title="Import SQL">
      <template #body>
        <div class="space-y-3">
          <UFormField :label="'SQL file (.sql)'">
            <input ref="sqlFileInput" type="file" accept=".sql" class="block w-full text-sm" />
          </UFormField>
          <p v-if="sqlImportError" class="text-xs text-red-600">{{ sqlImportError }}</p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" :label="$t('ui.actions.cancel')" @click="closeSqlImport" />
          <UButton color="primary" :label="$t('importExport.import.actions.confirm')" :loading="sqlImportLoading" @click="handleSqlImport" />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ImportJsonModal from '~/components/manage/modal/ImportJson.vue'
import { useApiFetch } from '@/utils/fetcher'

const { t } = useI18n()
const toast = useToast()
const apiFetch = useApiFetch

// JSON Export/Import
const jsonModalOpen = ref(false)
const jsonImportLoading = ref(false)
const jsonImportError = ref<string | null>(null)

const openJsonImport = () => { jsonModalOpen.value = true; jsonImportError.value = null }

const exportJson = async () => {
  try {
    const res = await apiFetch<{ success?: boolean; data?: any }>('/database/export.json')
    const payload = res?.data ?? {}
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `database-export-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.add({ title: t('ui.actions.export'), color: 'success' })
  } catch (error: any) {
    toast.add({ title: t('ui.notifications.error'), description: error?.data?.message || error?.message, color: 'error' })
  }
}

const handleJsonImport = async (file: File) => {
  jsonImportError.value = null
  try {
    jsonImportLoading.value = true
    const text = await file.text()
    let payload: any
    try {
      payload = JSON.parse(text)
    } catch {
      jsonImportError.value = t('importExport.import.errors.parseError')
      return
    }
    await apiFetch('/database/import.json', { method: 'POST', body: payload })
    toast.add({ title: t('ui.actions.import'), color: 'success' })
    jsonModalOpen.value = false
  } catch (error: any) {
    jsonImportError.value = error?.data?.message || error?.message || t('ui.notifications.error')
  } finally {
    jsonImportLoading.value = false
  }
}

// SQL Export/Import
const sqlModalOpen = ref(false)
const sqlImportLoading = ref(false)
const sqlImportError = ref<string | null>(null)
const sqlFileInput = ref<HTMLInputElement | null>(null)

const openSqlImport = () => { sqlModalOpen.value = true; sqlImportError.value = null }
const closeSqlImport = () => { sqlModalOpen.value = false; sqlImportError.value = null; if (sqlFileInput.value) sqlFileInput.value.value = '' }

const exportSql = async () => {
  try {
    const res = await apiFetch<Blob | ArrayBuffer>('/database/export.sql', { responseType: 'blob' as const })
    const blob = res instanceof Blob ? res : new Blob([res as any], { type: 'application/sql' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `database-export-${new Date().toISOString().slice(0,10)}.sql`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.add({ title: t('ui.actions.export'), color: 'success' })
  } catch (error: any) {
    toast.add({ title: t('ui.notifications.error'), description: error?.data?.message || error?.message, color: 'error' })
  }
}

const handleSqlImport = async () => {
  sqlImportError.value = null
  const file = sqlFileInput.value?.files?.[0]
  if (!file) { sqlImportError.value = 'Choose a .sql file'; return }
  try {
    sqlImportLoading.value = true
    const text = await file.text()
    await apiFetch('/database/import.sql', { method: 'POST', body: text, headers: { 'Content-Type': 'text/plain' } })
    toast.add({ title: t('ui.actions.import'), color: 'success' })
    closeSqlImport()
  } catch (error: any) {
    sqlImportError.value = error?.data?.message || error?.message || t('ui.notifications.error')
  } finally {
    sqlImportLoading.value = false
  }
}
</script>
