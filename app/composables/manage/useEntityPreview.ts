import { ref } from 'vue'

export interface PreviewPayload {
  title: string
  img: string | null
  shortText: string | null
  description: string | null
}

export function useEntityPreview() {
  const previewOpen = ref(false)
  const previewData = ref<PreviewPayload | null>(null)

  function setPreviewOpen(value: boolean) {
    previewOpen.value = value
    if (!value) previewData.value = null
  }

  function openPreviewFromEntity(entity: any, t?: (k: string) => string) {
    if (!entity) return
    previewData.value = {
      title: entity.name ?? entity.title ?? entity.code ?? (t ? t('common.untitled') : '—'),
      img: entity.image ?? entity.thumbnail_url ?? null,
      shortText: entity.short_text ?? entity.summary ?? null,
      description: entity.description ?? null,
    }
    previewOpen.value = true
  }

  return {
    previewOpen,
    previewData,
    setPreviewOpen,
    openPreviewFromEntity,
  }
}
