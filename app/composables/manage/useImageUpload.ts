// app/composables/manage/useImageUpload.ts
import { ref } from 'vue'

export function useImageUpload() {
  const isUploadingImage = ref(false)
  const imageFile = ref<File | null>(null)
  const imagePreview = ref<string | null>(null)
  const modalImageFieldConfig = ref<Record<string, unknown> | undefined>(undefined)

  function handleImageFile(file: File | null) {
    imageFile.value = file
  }

  function handleRemoveImage() {
    imageFile.value = null
    imagePreview.value = null
  }

  return {
    isUploadingImage,
    imageFile,
    imagePreview,
    modalImageFieldConfig,
    handleImageFile,
    handleRemoveImage,
  }
}
