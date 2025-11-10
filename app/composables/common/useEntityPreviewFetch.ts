// app/composables/common/useEntityPreviewFetch.ts
import { useApiFetch } from '@/utils/fetcher'

export async function fetchPreviewByFeedback(entityType?: string, entityId?: number) {
  if (!entityType || !entityId) return null
  const apiFetch = useApiFetch
  // Minimal placeholder; callers can switch per type if needed
  try {
    const res = await apiFetch<any>(`/${entityType}/${entityId}`, { method: 'GET' })
    return res?.data ?? res ?? null
  } catch {
    return null
  }
}
