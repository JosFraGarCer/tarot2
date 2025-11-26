// app/composables/admin/useEntityPreviewFetch.ts
import { useApiFetch } from '@/utils/fetcher'

/**
 * Unified entity preview fetcher for admin views.
 * Maps translation entity types to their base endpoint and fetches a snapshot with optional lang.
 */
export function useEntityPreviewFetch() {
  const apiFetch = useApiFetch

  const entityPreviewMap: Record<string, string> = {
    base_card_translations: '/base_card',
    base_card_translation: '/base_card',
    arcana_translation: '/arcana',
    arcana_translations: '/arcana',
    facet_translation: '/facet',
    facet_translations: '/facet',
    world_translations: '/world',
    world_translation: '/world',
    base_skills_translations: '/skills',
    base_card_type_translations: '/card_type',
  }

  async function fetchSnapshot(entityType: string, entityId: number, lang?: string | null) {
    const endpoint = entityPreviewMap[entityType] || `/${entityType}`
    if (!endpoint || !Number.isFinite(entityId)) return null
    try {
      const response = await apiFetch<{ success?: boolean; data: any }>(`${endpoint}/${entityId}`, {
        method: 'GET',
        params: lang ? { lang } : undefined,
      })
      return response?.data ?? response ?? null
    } catch {
      return null
    }
  }

  return { fetchSnapshot }
}
