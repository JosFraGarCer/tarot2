// app/composables/admin/useDatabaseManager.ts
import { ref } from 'vue'
import { useToast, useI18n } from '#imports'
import { useApiFetch } from '@/utils/fetcher'
import { getErrorMessage } from '@/utils/error'

export function useDatabaseManager() {
  const toast = useToast()
  const { t } = useI18n()
  const apiFetch = useApiFetch

  // 🔸 Estados generales
  const logs = ref<Array<{ type: string; ok: boolean; message: string; time: number }>>([])

  // JSON
  const jsonExporting = ref(false)
  const jsonImporting = ref(false)
  const jsonImportError = ref<string | null>(null)

  // SQL
  const sqlExporting = ref(false)
  const sqlImporting = ref(false)
  const sqlImportError = ref<string | null>(null)

  // 📦 Utilidades
  function log(type: string, ok: boolean, message: string) {
    logs.value.unshift({ type, ok, message, time: Date.now() })
  }

  function downloadFile(filename: string, content: Blob, type: string) {
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    log(`${type} Export`, true, 'Downloaded successfully')
  }

  // 🟢 JSON Export
  async function exportJson() {
    jsonExporting.value = true
    try {
      const res = await apiFetch<Record<string, unknown>>('/database/export.json')
      const payload = res?.data ?? res
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      downloadFile(`database-${new Date().toISOString().slice(0, 10)}.json`, blob, 'JSON')
      toast.add({ title: t('common.exportSuccess'), color: 'success' })
    } catch (e: unknown) {
      const message = getErrorMessage(e)
      toast.add({ title: t('ui.notifications.error'), description: message, color: 'error' })
      log('JSON Export', false, message)
    } finally {
      jsonExporting.value = false
    }
  }

  // 🟠 JSON Import
  async function importJson(file: File) {
    if (!file) throw new Error('No file provided')
    jsonImporting.value = true
    jsonImportError.value = null
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await apiFetch('/database/import.json', { method: 'POST', body: data })
      toast.add({ title: t('common.importSuccess'), color: 'success' })
      log('JSON Import', true, file.name)
    } catch (e: unknown) {
      const message = getErrorMessage(e)
      jsonImportError.value = message
      toast.add({ title: t('ui.notifications.error'), description: message, color: 'error' })
      log('JSON Import', false, message)
    } finally {
      jsonImporting.value = false
    }
  }

  // 🔵 SQL Export
  async function exportSql() {
    sqlExporting.value = true
    try {
      const res = await apiFetch('/database/export.sql', { responseType: 'blob' })
      const blob = res instanceof Blob ? res : new Blob([res as unknown as string], { type: 'application/sql' })
      downloadFile(`database-${new Date().toISOString().slice(0, 10)}.sql`, blob, 'SQL')
      toast.add({ title: t('common.exportSuccess'), color: 'success' })
    } catch (e: unknown) {
      const message = getErrorMessage(e)
      toast.add({ title: t('ui.notifications.error'), description: message, color: 'error' })
      log('SQL Export', false, message)
    } finally {
      sqlExporting.value = false
    }
  }

  // 🔴 SQL Import
  async function importSql(file: File) {
    if (!file) throw new Error('No file provided')
    sqlImporting.value = true
    sqlImportError.value = null
    try {
      const text = await file.text()
      await apiFetch('/database/import.sql', {
        method: 'POST',
        body: text,
        headers: { 'Content-Type': 'text/plain' }
      })
      toast.add({ title: t('common.importSuccess'), color: 'success' })
      log('SQL Import', true, file.name)
    } catch (e: unknown) {
      const message = getErrorMessage(e)
      sqlImportError.value = message
      toast.add({ title: t('ui.notifications.error'), description: message, color: 'error' })
      log('SQL Import', false, message)
    } finally {
      sqlImporting.value = false
    }
  }

  return {
    logs,

    jsonExporting,
    jsonImporting,
    jsonImportError,
    exportJson,
    importJson,

    sqlExporting,
    sqlImporting,
    sqlImportError,
    exportSql,
    importSql,

    log
  }
}
