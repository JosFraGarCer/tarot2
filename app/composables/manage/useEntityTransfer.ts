// app/composables/manage/useEntityTransfer.ts
import { ref } from 'vue'
import { useI18n, useToast } from '#imports'
import { useApiFetch } from '@/utils/fetcher'

interface UseEntityTransferOptions {
  resourcePath: string
  entityLabel: string
  filePrefix?: string
  onImported?: () => Promise<void> | void
  responseType?: 'json' | 'blob'
}

interface ExportParams {
  ids?: number[]
}

export function useEntityTransfer(options: UseEntityTransferOptions) {
  const toast = useToast?.()
  const { t } = useI18n()
  const apiFetch = useApiFetch

  const importing = ref(false)
  const exporting = ref(false)
  const importError = ref<string | null>(null)

  const resourceBase = options.resourcePath
    .replace(/^\/?api\/?/, '')
    .replace(/^\//, '')
    .replace(/\/$/, '')

  const filePrefix = options.filePrefix ?? resourceBase.split('/').pop() ?? 'export'

  function downloadFile(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function exportEntities(params: ExportParams = {}) {
    exporting.value = true
    try {
      const query = params.ids && params.ids.length
        ? { ids: params.ids.join(',') }
        : undefined

      const response = await apiFetch(`${resourceBase}/export`, {
        method: 'GET',
        params: query,
        responseType: options.responseType === 'blob' ? 'blob' : undefined,
      })

      let blob: Blob
      if (options.responseType === 'blob') {
        blob = response instanceof Blob ? response : new Blob([response])
      } else {
        const payload = (response as any)?.data ?? response
        blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      }
      const timestamp = new Date().toISOString().slice(0, 10)
      downloadFile(`${filePrefix}-${timestamp}.json`, blob)

      toast?.add?.({
        title: options.entityLabel,
        description: t('common.exportSuccess') || 'Export completed',
        color: 'success',
      })
      return true
    } catch (error: any) {
      const message = error?.data?.message ?? error?.message ?? String(error)
      toast?.add?.({
        title: options.entityLabel,
        description: message,
        color: 'error',
      })
      return false
    } finally {
      exporting.value = false
    }
  }

  async function importEntities(file: File) {
    if (!file) {
      importError.value = 'No file provided'
      return false
    }

    // Limit file size to 10MB to prevent DoS
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      importError.value = `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`
      return false
    }

    importing.value = true
    importError.value = null

    try {
      const text = await file.text()
      const payload = JSON.parse(text)

      await apiFetch(`${resourceBase}/import`, {
        method: 'POST',
        body: payload,
      })

      toast?.add?.({
        title: options.entityLabel,
        description: t('common.importSuccess') || 'Import completed',
        color: 'success',
      })

      await options.onImported?.()
      return true
    } catch (error: any) {
      const message = error?.data?.message ?? error?.message ?? String(error)
      importError.value = message
      toast?.add?.({
        title: options.entityLabel,
        description: message,
        color: 'error',
      })
      return false
    } finally {
      importing.value = false
    }
  }

  return {
    importing,
    exporting,
    importError,
    exportEntities,
    importEntities,
  }
}
