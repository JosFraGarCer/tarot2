// app/composables/useImagePreview.ts
import { ref, onBeforeUnmount } from 'vue'
import type { UploadFileLike } from '@/types/forms'

function extractFile(input: UploadFileLike): File | null {
  if (!input) return null
  if (input instanceof File) return input
  if (typeof input === 'object' && 'file' in input) {
    const potential = (input as { file?: File | null }).file
    return potential instanceof File ? potential : null
  }
  return null
}

export function normalizeFileValue(
  value: File | File[] | FileList | Array<{ file?: File | null }> | null | undefined
): File | null {
  if (!value) return null
  if (value instanceof File) return value
  if (Array.isArray(value)) {
    for (const item of value) {
      const file = extractFile(item as UploadFileLike)
      if (file) return file
    }
    return null
  }
  if (value instanceof FileList) {
    return value.item(0)
  }
  return extractFile(value as UploadFileLike)
}

export function useImagePreview() {
  const previewUrl = ref<string | null>(null)
  let objectUrl: string | null = null

  const setFile = (file: File | null) => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      objectUrl = null
    }
    if (file && typeof window !== 'undefined') {
      objectUrl = URL.createObjectURL(file)
      previewUrl.value = objectUrl
    } else {
      previewUrl.value = null
    }
  }

  const clear = () => setFile(null)

  onBeforeUnmount(() => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      objectUrl = null
    }
  })

  return { previewUrl, setFile, clear }
}
